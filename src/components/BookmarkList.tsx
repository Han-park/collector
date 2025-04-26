'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from '@/types';
import BookmarkCard from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  showUserInfo?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({ bookmarks: initialBookmarks, showUserInfo = false }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [isClient, setIsClient] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Set client-side flag to ensure we only run client-side code
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update bookmarks when initialBookmarks change
  useEffect(() => {
    setBookmarks(initialBookmarks);
  }, [initialBookmarks]);

  // Check if we should scroll to an anchor on load and set the highlighted bookmark
  useEffect(() => {
    if (isClient && window.location.hash) {
      const id = window.location.hash.substring(1);
      setHighlightedId(id);
      
      const element = document.getElementById(id);
      if (element) {
        // Add a slight delay to ensure the element is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [isClient, bookmarks]);

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No bookmarks yet. Add your first one!</p>
        <p className="text-gray-400 mt-2">Contact me on me@han-park.info to any requests.</p>
      </div>
    );
  }

  const handleDelete = (index: number) => {
    setBookmarks(prevBookmarks => prevBookmarks.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-4">
      {bookmarks.map((bookmark, index) => {
        // Create a unique ID for each bookmark based on its properties
        // Use the database ID if available, otherwise create a unique one from URL
        const bookmarkId = bookmark.id 
          ? `bookmark-${bookmark.id}`
          : `bookmark-${index}-${bookmark.url.replace(/[^a-zA-Z0-9]/g, '')}`.substring(0, 50);
        
        return (
          <BookmarkCard 
            key={bookmark.id ? `bookmark-${bookmark.id}` : `${bookmark.url}-${index}`} 
            bookmark={bookmark} 
            showUserInfo={showUserInfo}
            onDelete={() => handleDelete(index)}
            id={bookmarkId}
            isHighlighted={highlightedId === bookmarkId}
          />
        );
      })}
    </div>
  );
};

export default BookmarkList; 