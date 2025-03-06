'use client';

import { useState, useEffect } from 'react';
import { Bookmark } from '@/types';
import BookmarkList from '@/components/BookmarkList';
import { createClient } from '@/utils/supabase-browser';

interface UserBookmarksProps {
  initialBookmarks: Bookmark[];
  userId: string;
  username: string;
}

export default function UserBookmarks({ initialBookmarks, userId, username }: UserBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Set up real-time subscription for collection changes for this user
    const subscription = supabase
      .channel(`collection_changes_${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'collection',
          filter: `UID=eq.${userId}`
        }, 
        async () => {
          // Refresh bookmarks when changes occur
          setIsLoading(true);
          
          const { data, error } = await supabase
            .from('collection')
            .select('*')
            .eq('UID', userId)
            .order('created_at', { ascending: false });
          
          if (!error && data) {
            const updatedBookmarks: Bookmark[] = data.map(item => ({
              url: item.url,
              title: item.title,
              summary: item.summary,
              topic: item.topic,
              source: item.source,
              createdAt: item.created_at,
              user_id: item.UID,
              user_display_name: username
            }));
            
            setBookmarks(updatedBookmarks);
          }
          
          setIsLoading(false);
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [userId, username, supabase]);

  if (isLoading && bookmarks.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-400">No bookmarks found</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute top-0 right-0">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-gray-400">Refreshing...</span>
          </div>
        </div>
      )}
      <BookmarkList bookmarks={bookmarks} />
    </div>
  );
} 