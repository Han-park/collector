'use client';

import React, { useState } from 'react';
import { Bookmark } from '@/types';
import BookmarkCard from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: Bookmark[];
  showUserInfo?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({ bookmarks: initialBookmarks, showUserInfo = false }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No bookmarks yet. Add your first one!</p>
        <p className="text-gray-400 mt-2">This app is now a demo app. You can add bookmarks, but they will not be saved.</p>
        <p className="text-gray-400 mt-2">Contact me on me@han-park.info to any requests.</p>
      </div>
    );
  }

  const handleDelete = (index: number) => {
    setBookmarks(prevBookmarks => prevBookmarks.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark, index) => (
        <BookmarkCard 
          key={`${bookmark.url}-${index}`} 
          bookmark={bookmark} 
          showUserInfo={showUserInfo}
          onDelete={() => handleDelete(index)}
        />
      ))}
    </div>
  );
};

export default BookmarkList; 