import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieValue = await cookieStore;
            return cookieValue.get(name)?.value;
          },
          async set(name: string, value: string, options: Record<string, unknown>) {
            const cookieValue = await cookieStore;
            cookieValue.set({ name, value, ...options });
          },
          async remove(name: string, options: Record<string, unknown>) {
            const cookieValue = await cookieStore;
            cookieValue.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    
    // If we have a user, redirect to their profile page
    if (data?.user) {
      // Try to get the user's display name from metadata
      const displayName = data.user.user_metadata?.display_name;
      
      if (displayName) {
        // If user has a display name, redirect to their profile page
        return NextResponse.redirect(new URL(`/u/${displayName}`, request.url));
      } else {
        // If no display name is set, try to fetch it from the profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single();
          
        if (profileData?.display_name) {
          return NextResponse.redirect(new URL(`/u/${profileData.display_name}`, request.url));
        }
      }
    }
  }

  // Default fallback: redirect to home page if we couldn't determine the user profile
  return NextResponse.redirect(new URL('/', request.url));
} 