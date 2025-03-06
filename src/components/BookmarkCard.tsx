'use client';

import React, { useState } from 'react';
import { Bookmark } from '@/types';
import Link from 'next/link';
import { createClient } from '@/utils/supabase-browser';
import { useAuth } from '@/context/AuthContext';

interface BookmarkCardProps {
  bookmark: Bookmark;
  showUserInfo?: boolean;
  onDelete?: () => void;
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  bookmark, 
  showUserInfo = false,
  onDelete
}) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();
  
  const isOwner = user && bookmark.user_id === user.id;
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isOwner || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('collection')
        .delete()
        .eq('url', bookmark.url)
        .eq('UID', user!.id);
      
      if (error) {
        console.error('Error deleting bookmark:', error);
        alert('Failed to delete bookmark');
      } else if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-gray-700 bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-2 text-white">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-300"
            >
              {bookmark.title}
            </a>
          </h3>
          
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-700 transition-colors"
              title="Delete bookmark"
            >
              {isDeleting ? (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-gray-700 text-blue-300 rounded-full">{bookmark.topic}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 text-green-300 rounded-full">{bookmark.source}</span>
          {showUserInfo && bookmark.user_display_name && (
            <Link 
              href={`/u/${bookmark.user_display_name}`}
              className="text-xs px-2 py-1 bg-gray-700 text-purple-300 rounded-full hover:bg-gray-600"
            >
              @{bookmark.user_display_name}
            </Link>
          )}
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
  );
};

export default BookmarkCard; 