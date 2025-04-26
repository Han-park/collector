import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import axios from 'axios';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { Bookmark } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate limiter implementation
class RateLimiter {
  private timestamps: number[] = [];
  private readonly limit: number;
  private readonly interval: number; // in milliseconds

  constructor(limit: number, intervalInSeconds: number) {
    this.limit = limit;
    this.interval = intervalInSeconds * 1000;
  }

  async throttle(): Promise<{ success: boolean; retryAfter?: number }> {
    const now = Date.now();
    
    // Remove timestamps outside the current interval window
    this.timestamps = this.timestamps.filter(timestamp => 
      now - timestamp < this.interval
    );
    
    // Check if we've reached the limit
    if (this.timestamps.length >= this.limit) {
      // Calculate time to wait until next available slot
      const oldestTimestamp = this.timestamps[0];
      const timeToWait = Math.ceil((this.interval - (now - oldestTimestamp)) / 1000);
      
      return { 
        success: false, 
        retryAfter: timeToWait 
      };
    }
    
    // Add current timestamp and allow the request
    this.timestamps.push(now);
    return { success: true };
  }
}

// Create a rate limiter instance: 5 calls per 60 seconds
const openaiRateLimiter = new RateLimiter(20, 60);

// Function to extract source from URL
function extractSourceFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove www. prefix if present
    const domain = hostname.replace(/^www\./, '');
    
    // Handle common sources
    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
      return 'YouTube';
    } else if (domain.includes('medium.com')) {
      return 'Medium';
    } else if (domain.includes('substack.com')) {
      return 'Substack';
    } else if (domain.includes('github.com')) {
      return 'GitHub';
    } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
      return 'Twitter';
    } else if (domain.includes('linkedin.com')) {
      return 'LinkedIn';
    } else {
      // Extract the main domain name (e.g., example.com -> example)
      const parts = domain.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
      return domain;
    }
  } catch (error) {
    console.error('Error extracting source:', error);
    return 'Unknown';
  }
}

export async function POST(request: Request) {
  try {
    const { url, token } = await request.json();
    
    // Also check for Authorization header
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Use either the token from the body or the Authorization header
    const accessToken = token || headerToken;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
    }

    // Get the current user using the provided token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError) {
      console.error('Authentication error:', authError.message);
      return NextResponse.json({ error: `Authentication failed: ${authError.message}` }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found with the provided token');
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const userId = user.id;
    
    // Get the display name from user metadata
    const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || userId.substring(0, 8);

    // Fetch the HTML content of the URL
    const response = await axios.get(url);
    const html = response.data;
    
    // Parse the HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Extract metadata with more thorough title extraction
    let pageTitle = $('title').text().trim();
    
    // If title is empty, try other common meta tags
    if (!pageTitle) {
      pageTitle = $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="twitter:title"]').attr('content') || 
                 $('h1').first().text().trim() || '';
    }
    
    // Clean up the title (remove site name suffixes like " - Example Site")
    pageTitle = pageTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
    
    const pageDescription = $('meta[name="description"]').attr('content') || 
                           $('meta[property="og:description"]').attr('content') || 
                           $('meta[name="twitter:description"]').attr('content') || '';
    
    // Apply rate limiting before making the OpenAI API call
    const rateLimitResult = await openaiRateLimiter.throttle();
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit reached. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': `${rateLimitResult.retryAfter}`
          }
        }
      );
    }
    
    // Only use OpenAI to generate summary and topic, and title only if needed
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates concise bookmark information. For YouTube videos, focus on the specific video content, not general YouTube platform descriptions."
        },
        {
          role: "user",
          content: `Generate a concise summary (max 30 words) and a single topic category for this content. ${!pageTitle ? "Also generate a title." : ""} Format as JSON with keys: ${!pageTitle ? "title, " : ""}summary, topic.
          
          ${pageTitle ? `Title: ${pageTitle}` : ""}
          Description: ${pageDescription}
          URL: ${url}
          
          Important: If this is a YouTube video, focus on summarizing the specific video content, not describing YouTube as a platform. Avoid generic descriptions like "Upload and share videos" or "Discover and share your favorite videos".`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the AI response
    const aiResponse = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Extract source from URL
    const source = extractSourceFromUrl(url);
    
    // Create bookmark object for the collection table
    const collectionItem = {
      title: pageTitle || aiResponse.title || "Untitled Bookmark",
      summary: aiResponse.summary || pageDescription,
      topic: aiResponse.topic || 'Uncategorized',
      source,
      url,
      UID: userId // Using UID field as per your collection table schema
    };

    // Store the bookmark in Supabase collection table
    const { data: savedBookmark, error } = await supabase
      .from('collection')
      .insert([collectionItem])
      .select()
      .single();

    if (error) {
      console.error('Error saving to collection:', error);
      return NextResponse.json(
        { error: 'Failed to save bookmark to collection' },
        { status: 500 }
      );
    }

    // Format the response to match the Bookmark interface
    const bookmark: Bookmark = {
      id: savedBookmark.id,
      url: savedBookmark.url,
      title: savedBookmark.title,
      summary: savedBookmark.summary,
      topic: savedBookmark.topic,
      source: savedBookmark.source,
      createdAt: savedBookmark.created_at,
      user_id: savedBookmark.UID,
      user_display_name: displayName,
    };

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    );
  }
} 