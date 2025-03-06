import React, { useState } from 'react';
import { Bookmark } from '@/types';

interface BookmarkFormProps {
  onBookmarkCreated: (bookmark: Bookmark) => void;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({ onBookmarkCreated }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setIsRateLimited(false);
      
      const response = await fetch('/api/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if the error is due to rate limiting
        if (response.status === 429 || errorData.error?.toLowerCase().includes('rate limit')) {
          setIsRateLimited(true);
          throw new Error('Rate limit reached. Please try again in a moment.');
        }
        
        throw new Error(errorData.error || 'Failed to create bookmark');
      }

      const bookmark = await response.json();
      onBookmarkCreated(bookmark);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="url" className="text-sm font-medium text-gray-300">
            Paste a URL to create a bookmark
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {isRateLimited && (
          <div className="bg-yellow-900 border border-yellow-800 text-yellow-200 px-4 py-2 rounded-md text-sm">
            <p>Rate limit reached (5 bookmarks per minute). Please wait a moment before creating more bookmarks.</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default BookmarkForm; 