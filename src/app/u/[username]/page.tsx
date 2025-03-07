import { createClient } from '@/utils/supabase-server';
import { notFound } from 'next/navigation';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';

export const revalidate = 60; // Revalidate this page every 60 seconds

type Props = {
  params: {
    username: string
  }
}

export default async function UserPage({ params }: Props) {
  const username = params.username;
  
  try {
    const supabase = await createClient();

    // Fetch all bookmarks to find users
    const { data: allBookmarks, error: bookmarksError } = await supabase
      .from('collection')
      .select('UID')
      .order('created_at', { ascending: false });
      
    if (bookmarksError) {
      console.error('Error fetching bookmarks:', bookmarksError.message);
      notFound();
    }
    
    // Get unique user IDs
    const userIds = [...new Set(allBookmarks?.map(item => item.UID) || [])];
    
    // Try to find a user with a matching display name
    let matchedUserId = null;
    
    for (const userId of userIds) {
      try {
        // Try to get user data from Supabase Auth
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        
        if (userData?.user) {
          // Check if display name or email username matches
          const userDisplayName = userData.user.user_metadata?.display_name || 
                                 userData.user.email?.split('@')[0];
          
          if (userDisplayName === username) {
            matchedUserId = userId;
            break;
          }
        }
      } catch (err) {
        console.error(`Error fetching user data for ${userId}:`, err);
      }
    }
    
    // If no user found with matching display name, try to see if username is a user ID
    if (!matchedUserId && userIds.some(id => id.startsWith(username))) {
      matchedUserId = userIds.find(id => id.startsWith(username));
    }
    
    // If still no match, show not found
    if (!matchedUserId) {
      notFound();
    }

    // Fetch user's bookmarks from collection table
    const { data: collectionItems, error: collectionError } = await supabase
      .from('collection')
      .select('*')
      .eq('UID', matchedUserId)
      .order('created_at', { ascending: false });

    if (collectionError) {
      console.error('Error fetching bookmarks:', collectionError.message);
      // Continue with empty bookmarks rather than failing
    }

    // Get user data for display
    let displayName = username;
    let joinedDate = new Date();
    
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(matchedUserId);
      if (userData?.user) {
        // Use display name from metadata, or email username
        displayName = userData.user.user_metadata?.display_name || 
                     userData.user.email?.split('@')[0] || 
                     username;
        
        // Use created_at from user data if available
        if (userData.user.created_at) {
          joinedDate = new Date(userData.user.created_at);
        }
      }
    } catch (err) {
      console.error(`Error fetching user data for display:`, err);
    }

    // Transform collection items to match the Bookmark interface
    const bookmarks: Bookmark[] = (collectionItems || []).map(item => ({
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{displayName}</h1>
              <p className="text-gray-400">Joined {joinedDate.toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Bookmarks</h2>
          </div>
          
          {bookmarks.length > 0 ? (
            <BookmarkList bookmarks={bookmarks} />
          ) : (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400">No bookmarks found</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error in user profile page:', err);
    notFound();
  }
} 