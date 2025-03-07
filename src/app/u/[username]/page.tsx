import { createClient } from '@/utils/supabase-server';
import { notFound } from 'next/navigation';
import BookmarkList from '@/components/BookmarkList';
import ClientBookmarkActivityGraph from '@/components/ClientBookmarkActivityGraph';
import { Bookmark } from '@/types';

export const revalidate = 60; // Revalidate this page every 60 seconds

// In Next.js 15, we need to use the correct type for params
type PageProps = {
  params: Promise<{ username: string }>
}

export default async function UserPage({ params }: PageProps) {
  // Await the params object before accessing its properties
  const resolvedParams = await params;
  const username = resolvedParams.username;
  
  try {
    const supabase = await createClient();

    // Query the profiles table with the correct structure
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, UID, display_name, created_at, bio')
      .eq('display_name', username)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error fetching profile:', profileError.message);
      notFound();
    }
    
    // If we found a profile, use that user's UID
    // If not, we'll try to find bookmarks with a matching user display name
    let userId = profileData?.UID;
    let displayName = username;
    let joinedDate = new Date();
    let userBio = '';
    
    if (profileData) {
      displayName = profileData.display_name;
      if (profileData.created_at) {
        joinedDate = new Date(profileData.created_at);
      }
      userBio = profileData.bio || '';
    }
    
    // If we don't have a userId yet, we need to try a different approach
    // We'll fetch all bookmarks and look for matching display names in the metadata
    if (!userId) {
      // Fetch all bookmarks to find users
      const { data: allBookmarks, error: bookmarksError } = await supabase
        .from('collection')
        .select('UID, metadata')
        .order('created_at', { ascending: false });
        
      if (bookmarksError) {
        console.error('Error fetching bookmarks:', bookmarksError.message);
        notFound();
      }
      
      // Look for bookmarks with matching user display name in metadata
      const matchingBookmark = allBookmarks?.find(bookmark => 
        bookmark.metadata?.user_display_name === username
      );
      
      if (matchingBookmark) {
        userId = matchingBookmark.UID;
      } else {
        // No matching user found
        notFound();
      }
    }
    
    // Now fetch the user's bookmarks
    const { data: bookmarks, error: bookmarksError } = await supabase
      .from('collection')
      .select('*')
      .eq('UID', userId)
      .order('created_at', { ascending: false });
      
    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError.message);
      notFound();
    }

    // Transform collection items to match the Bookmark interface
    const bookmarksFormatted: Bookmark[] = (bookmarks || []).map(item => ({
      url: item.url,
      title: item.title,
      summary: item.summary || '',
      topic: item.topic || 'Uncategorized',
      source: item.source || 'Unknown',
      createdAt: item.created_at,
      user_id: item.UID,
      user_display_name: displayName
    }));
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
          {userBio && <p className="text-gray-300 mb-2">{userBio}</p>}
          <p className="text-gray-400">
            Joined {joinedDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Activity Graph Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Consistency</h2>
          <ClientBookmarkActivityGraph bookmarks={bookmarksFormatted} weeks={8} />
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Collections</h2>
          </div>
          
          {bookmarksFormatted.length > 0 ? (
            <BookmarkList bookmarks={bookmarksFormatted} />
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">No collections yet</p>
            </div>
          )}
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Error in user profile page:', error);
    notFound();
  }
} 