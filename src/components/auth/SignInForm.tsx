'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');
  
  const { signIn, signInWithMagicLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (authMethod === 'password') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signInWithMagicLink(email);
        if (error) throw error;
        setMessage('Check your email for the magic link');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Sign In</h2>
        
        <div className="flex justify-center mb-6">
          <div className="flex rounded-md overflow-hidden">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                authMethod === 'password'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setAuthMethod('password')}
            >
              Password
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                authMethod === 'magic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setAuthMethod('magic')}
            >
              Magic Link
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              disabled={isLoading}
            />
          </div>
          
          {authMethod === 'password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <Link href="/auth/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>
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
          )}
          
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading
              ? 'Loading...'
              : authMethod === 'password'
              ? 'Sign In'
              : 'Send Magic Link'}
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
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 