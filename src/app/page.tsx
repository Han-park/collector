"use client";

import React, { useState, useEffect, useCallback } from 'react';
import BookmarkForm from '@/components/BookmarkForm';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase-browser';

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  // Function to fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Fetch from collection table
      const { data, error } = await supabase
        .from('collection')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) {
        console.error('Error fetching bookmarks:', error.message);
        return;
      }
      
      if (data) {
        // Create a map to store user display names
        const userDisplayNames = new Map();
        
        // Get unique user IDs
        const userIds = [...new Set(data.map(item => item.UID))];
        
        // Fetch user metadata for each user ID
        for (const userId of userIds) {
          try {
            // Try to get user data from Supabase Auth
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            
            if (userData?.user) {
              // Use display name from metadata, or email username, or user ID
              const displayName = 
                userData.user.user_metadata?.display_name || 
                userData.user.email?.split('@')[0] || 
                userId.substring(0, 8);
              
              userDisplayNames.set(userId, displayName);
            } else {
              // Fallback if user not found
              userDisplayNames.set(userId, userId.substring(0, 8));
            }
          } catch (err) {
            console.error(`Error fetching user data for ${userId}:`, err);
            // Fallback if error
            userDisplayNames.set(userId, userId.substring(0, 8));
          }
        }
        
        // Transform the data to match the Bookmark interface
        const formattedBookmarks: Bookmark[] = data.map(item => {
          return {
            url: item.url,
            title: item.title,
            summary: item.summary || '',
            topic: item.topic || 'Uncategorized',
            source: item.source || 'Unknown',
            createdAt: item.created_at,
            user_id: item.UID,
            user_display_name: userDisplayNames.get(item.UID) || item.UID.substring(0, 8)
          };
        });
        
        setBookmarks(formattedBookmarks);
      } else {
        setBookmarks([]);
      }
    } catch (err) {
      console.error('Error in fetchBookmarks:', err);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Fetch all bookmarks when the component mounts
  useEffect(() => {
    fetchBookmarks();
    
    // Set up real-time subscription for collection changes
    const subscription = supabase
      .channel('collection_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'collection' 
        }, 
        () => {
          // Refresh bookmarks when changes occur
          fetchBookmarks();
        }
      )
      .subscribe();
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBookmarks, supabase]);

  const handleBookmarkCreated = () => {
    // Refresh the bookmarks list after creating a new bookmark
    fetchBookmarks();
  };

  return (
    <>
      {user && (
        <BookmarkForm onBookmarkCreated={handleBookmarkCreated} />
      )}
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Recent Bookmarks</h2>
          {isLoading && (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-gray-400">Refreshing...</span>
            </div>
          )}
        </div>
        
        {isLoading && bookmarks.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookmarks.length > 0 ? (
          <BookmarkList 
            bookmarks={bookmarks} 
            showUserInfo={true} 
          />
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400">No bookmarks found</p>
          </div>
        )}
      </div>
    </>
  );
}
