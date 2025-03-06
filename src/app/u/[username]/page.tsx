import { createClient } from '@/utils/supabase-server';
import { notFound } from 'next/navigation';
import BookmarkList from '@/components/BookmarkList';
import Link from 'next/link';
import { Bookmark } from '@/types';

export const revalidate = 60; // Revalidate this page every 60 seconds

interface UserProfilePageProps {
  params: {
    username: string;
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const username = params.username;
  
  try {
    const supabase = await createClient();

    // Fetch user profile by display name
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('display_name', username)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      notFound();
    }

    // Fetch user's bookmarks from collection table
    const { data: collectionItems, error: collectionError } = await supabase
      .from('collection')
      .select('*')
      .eq('UID', profile.id)
      .order('created_at', { ascending: false });

    if (collectionError) {
      console.error('Error fetching bookmarks:', collectionError.message);
      // Continue with empty bookmarks rather than failing
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
      user_display_name: username
    }));

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{username}</h1>
              <p className="text-gray-400">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
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