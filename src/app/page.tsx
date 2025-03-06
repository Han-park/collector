"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import BookmarkForm from '@/components/BookmarkForm';
import BookmarkList from '@/components/BookmarkList';
import { Bookmark } from '@/types';

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const handleBookmarkCreated = (newBookmark: Bookmark) => {
    setBookmarks((prevBookmarks) => [newBookmark, ...prevBookmarks]);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image 
              src="/img/logo-0.png" 
              alt="Collector Logo" 
              width={200} 
              height={200}
              className="rounded-md w-8 h-8"
            />
            <div>
              <h1 className="text-2xl font-normal text-white font-mono">Collector</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <BookmarkForm onBookmarkCreated={handleBookmarkCreated} />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Your Bookmarks</h2>
          <BookmarkList bookmarks={bookmarks} />
        </div>
      </main>
    </div>
  );
}
