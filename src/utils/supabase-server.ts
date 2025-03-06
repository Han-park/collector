import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function createClient() {
  try {
    // Create a direct Supabase client without cookies
    // This will only work for public data or with admin key
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
} 