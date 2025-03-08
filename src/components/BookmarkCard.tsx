'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark } from '@/types';
import Link from 'next/link';
import { createClient } from '@/utils/supabase-browser';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Share2Icon, TrashIcon } from '@radix-ui/react-icons';

interface BookmarkCardProps {
  bookmark: Bookmark;
  showUserInfo?: boolean;
  onDelete?: () => void;
  id?: string; // Optional ID for anchor scrolling
  isHighlighted?: boolean; // Whether this bookmark is highlighted (from a shared link)
}

const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
  bookmark, 
  showUserInfo = false,
  onDelete,
  id,
  isHighlighted = false
}) => {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareTooltip, setShareTooltip] = useState(false);
  const [highlight, setHighlight] = useState(isHighlighted);
  const supabase = createClient();
  const pathname = usePathname();
  
  // Effect to handle highlight animation
  useEffect(() => {
    if (isHighlighted) {
      // Set highlight immediately
      setHighlight(true);
      
      // After 5 seconds, fade out the highlight
      const timer = setTimeout(() => {
        setHighlight(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);
  
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

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create the share URL with the bookmark ID as anchor
    const shareUrl = `${window.location.origin}${pathname}${id ? `#${id}` : ''}`;
    
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: bookmark.title,
        text: bookmark.summary,
        url: shareUrl
      }).catch(err => {
        console.error('Error sharing:', err);
        // Fallback to clipboard copy
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback to clipboard copy
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShareTooltip(true);
      setTimeout(() => setShareTooltip(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  // Determine card classes based on highlight state
  const cardClasses = `border ${highlight 
    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/20 animate-pulse-slow' 
    : 'border-gray-700 bg-gray-800'} rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow scroll-mt-20`;

  return (
    <div 
      id={id} 
      className={cardClasses}
    >
      
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
   
          <div className="flex items-center space-x-2">
            {/* Share button */}
            <div className="relative">
              <button
                onClick={handleShare}
                className="text-gray-400 hover:text-blue-400 p-1 rounded-full hover:bg-gray-700 transition-colors"
                title="Share bookmark"
              >
                <Share2Icon className="w-4 h-4" />
              </button>
              {shareTooltip && (
                <div className="absolute right-0 top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded z-10 whitespace-nowrap">
                  Link copied!
                </div>
              )}
            </div>
            
            {/* Delete button (if owner) */}
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
                  <TrashIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-400">
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </span>

        <div className="flex flex-wrap gap-2">
          <span className="text-xs px-2 py-1 bg-gray-700 text-blue-300 rounded-full">{bookmark.topic}</span>
          <span className="text-xs px-2 py-1 bg-gray-700 text-green-300 rounded-full">{bookmark.source}</span>
          {showUserInfo && bookmark.user_display_name && (
            <Link 
              href={`/u/${bookmark.user_display_name}`}
              className="text-xs px-2 py-1 rounded-full hover:text-blue-300"
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
        </div>
      </div>
    </div>
  );
};

export default BookmarkCard; 