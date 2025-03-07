'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Bookmark } from '@/types';

// Dynamically import the BookmarkActivityGraph component with no SSR
const BookmarkActivityGraph = dynamic(
  () => import('./BookmarkActivityGraph'),
  { ssr: false }
);

interface ClientBookmarkActivityGraphProps {
  bookmarks: Bookmark[];
  weeks?: number;
}

const ClientBookmarkActivityGraph: React.FC<ClientBookmarkActivityGraphProps> = ({ 
  bookmarks, 
  weeks 
}) => {
  return <BookmarkActivityGraph bookmarks={bookmarks} weeks={weeks} />;
};

export default ClientBookmarkActivityGraph; 