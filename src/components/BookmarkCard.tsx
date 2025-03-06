import React from 'react';
import { Bookmark } from '@/types';

interface BookmarkCardProps {
  bookmark: Bookmark;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark }) => {
  return (
    <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
    <div className="border border-gray-700 bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2">
   
          <h3 className="text-lg font-semibold line-clamp-2 text-white">{bookmark.title}</h3>
        

        <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-gray-700 text-blue-300 rounded-full">{bookmark.topic}</span>
            <span className="text-xs px-2 py-1 bg-gray-700 text-green-300 rounded-full">{bookmark.source}</span>
          </div>
        <p className="text-sm text-gray-300 line-clamp-3">{bookmark.summary}</p>
        <div className="flex justify-between items-center mt-2">
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline truncate max-w-[80%]"
          >
            {bookmark.url}
          </a>
          <span className="text-xs text-gray-400">
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
    </a>
  );
};

export default BookmarkCard; 