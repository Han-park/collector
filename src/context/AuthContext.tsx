'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase-browser';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateDisplayName: (displayName: string) => Promise<{ error: AuthError | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string) => {
    return supabase.auth.signUp({ email, password });
  };

  const signInWithMagicLink = async (email: string) => {
    return supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    try {
      // First, manually clear the local state
      setUser(null);
      setSession(null);
      
      // Then attempt to sign out from Supabase
      // Even if this fails, the user will be signed out locally
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        // Ignore the "Auth session missing!" error
        // The user is already signed out locally
        console.log("Supabase sign out error (ignored):", signOutError);
      }
      
      // Clear any auth-related cookies or local storage
      // This is a belt-and-suspenders approach
      if (typeof window !== 'undefined') {
        // Clear any auth cookies
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
        
        // Force a page reload to clear any in-memory state
        // Uncomment if needed:
        // window.location.href = '/';
      }
      
      return { error: null };
    } catch (err) {
      console.error('Error during sign out:', err);
      // Even on error, we've already cleared the local state
      return { error: null }; // Return null to prevent further errors
    }
  };

  const updatePassword = async (password: string) => {
    return supabase.auth.updateUser({ password });
  };

  const updateDisplayName = async (displayName: string) => {
    // Update user metadata with display name
    const { data, error } = await supabase.auth.updateUser({
      data: { display_name: displayName }
    });

    if (!error && data?.user) {
      // Also store in public profiles table for easier querying
      await supabase
        .from('profiles')
        .upsert({ 
          id: data.user.id, 
          display_name: displayName,
          email: data.user.email,
          updated_at: new Date().toISOString() 
        }, { 
          onConflict: 'id' 
        });
    }

    return { error };
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    updatePassword,
    updateDisplayName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 