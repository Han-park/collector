'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bookmark } from '@/types';
import ErrorBoundary from './ErrorBoundary';

// Dynamically import the BookmarkActivityGraph component with no SSR
const BookmarkActivityGraph = dynamic(
  () => import('./BookmarkActivityGraph'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Loading activity graph...</p>
        </div>
      </div>
    )
  }
);

interface ClientBookmarkActivityGraphProps {
  bookmarks: Bookmark[];
  weeks?: number;
}

const ClientBookmarkActivityGraph: React.FC<ClientBookmarkActivityGraphProps> = ({ 
  bookmarks, 
  weeks 
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state when bookmarks change
  useEffect(() => {
    setHasError(false);
  }, [bookmarks]);

  // Validate bookmarks data
  const validBookmarks = bookmarks?.filter(bookmark => 
    bookmark && bookmark.createdAt && !isNaN(new Date(bookmark.createdAt).getTime())
  ) || [];

  if (hasError) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Unable to display activity graph</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-md">
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">Error loading activity graph</p>
          </div>
        </div>
      }
      onError={() => setHasError(true)}
    >
      <BookmarkActivityGraph bookmarks={validBookmarks} weeks={weeks} />
    </ErrorBoundary>
  );
};

export default ClientBookmarkActivityGraph; 