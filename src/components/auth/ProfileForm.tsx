'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { createClient } from '@/utils/supabase-browser';

export default function ProfileForm() {
  const { user, updatePassword, updateDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);
  const [isCountLoading, setIsCountLoading] = useState(true);
  const supabase = createClient();

  // Load display name from user metadata and bio from profiles table when component mounts
  useEffect(() => {
    if (user?.user_metadata?.display_name) {
      setDisplayName(user.user_metadata.display_name);
    }

    // Fetch profile data from profiles table
    async function fetchProfileData() {
      if (user) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('bio')
          .eq('UID', user.id)
          .single();
        
        if (!error && profileData) {
          setBio(profileData.bio || '');
        }
      }
    }

    // Fetch bookmark count
    async function fetchBookmarkCount() {
      if (user) {
        setIsCountLoading(true);
        const { count, error } = await supabase
          .from('collection')
          .select('*', { count: 'exact', head: true })
          .eq('UID', user.id);
        
        if (!error && count !== null) {
          setBookmarkCount(count);
        }
        setIsCountLoading(false);
      }
    }

    fetchProfileData();
    fetchBookmarkCount();
  }, [user, supabase]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) throw updateError;
      
      setMessage('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDisplayNameLoading(true);
    setDisplayNameError(null);
    setDisplayNameMessage(null);

    // Validate display name
    if (!displayName.trim()) {
      setDisplayNameError('Display name cannot be empty');
      setIsDisplayNameLoading(false);
      return;
    }

    // Validate display name format (alphanumeric, underscores, hyphens only)
    if (!/^[a-zA-Z0-9_-]+$/.test(displayName)) {
      setDisplayNameError('Display name can only contain letters, numbers, underscores, and hyphens');
      setIsDisplayNameLoading(false);
      return;
    }

    try {
      // First update the display name in auth metadata
      const { error: updateError } = await updateDisplayName(displayName);
      if (updateError) throw updateError;
      
      // Then update or insert the profile record
      if (user) {
        // Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('UID', user.id)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          // Error other than "not found"
          throw fetchError;
        }
        
        if (existingProfile) {
          // Update existing profile
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({
              display_name: displayName,
              bio: bio
            })
            .eq('UID', user.id);
          
          if (profileUpdateError) throw profileUpdateError;
        } else {
          // Insert new profile
          const { error: profileInsertError } = await supabase
            .from('profiles')
            .insert({
              UID: user.id,
              display_name: displayName,
              bio: bio
            });
          
          if (profileInsertError) throw profileInsertError;
        }
      }
      
      setDisplayNameMessage('Profile updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating profile';
      setDisplayNameError(errorMessage);
    } finally {
      setIsDisplayNameLoading(false);
    }
  };

  const userProfileUrl = displayName ? `/u/${displayName}` : null;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Profile</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Account Information</h3>
          <div className="bg-gray-700 p-4 rounded-md">
            <p className="text-gray-300 mb-2">
              <span className="text-gray-400">Email:</span> {user?.email}
            </p>
            {user?.user_metadata?.display_name && (
              <p className="text-gray-300">
                <span className="text-gray-400">Display Name:</span> {user.user_metadata.display_name}
                {userProfileUrl && (
                  <Link href={userProfileUrl} className="ml-2 text-blue-400 hover:text-blue-300 text-sm">
                    View Profile
                  </Link>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Your Collection</h3>
          <div className="bg-gray-700 p-4 rounded-md">
            {isCountLoading ? (
              <p className="text-gray-300">Loading collection stats...</p>
            ) : (
              <>
                <p className="text-gray-300 mb-2">
                  <span className="text-gray-400">Saved Bookmarks:</span> {bookmarkCount}
                </p>
                {userProfileUrl && bookmarkCount > 0 && (
                  <Link 
                    href={userProfileUrl} 
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Your Collection
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Update Profile</h3>
          <form onSubmit={handleDisplayNameSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Choose a unique display name"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                disabled={isDisplayNameLoading}
              />
              <p className="mt-1 text-xs text-gray-400">
                This will be used for your public profile URL: /u/{displayName || 'your-name'}
              </p>
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself"
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                disabled={isDisplayNameLoading}
              />
              <p className="mt-1 text-xs text-gray-400">
                A short description that will appear on your profile page
              </p>
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isDisplayNameLoading}
            >
              {isDisplayNameLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
          
          {displayNameError && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-md">
              <p className="text-sm text-red-200">{displayNameError}</p>
            </div>
          )}
          
          {displayNameMessage && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-800 rounded-md">
              <p className="text-sm text-green-200">{displayNameMessage}</p>
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Update Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-md">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          {message && (
            <div className="mt-4 p-3 bg-green-900/50 border border-green-800 rounded-md">
              <p className="text-sm text-green-200">{message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 