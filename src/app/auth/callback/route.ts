import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieValue = await cookieStore;
            return cookieValue.get(name)?.value;
          },
          async set(name: string, value: string, options: Record<string, unknown>) {
            const cookieValue = await cookieStore;
            cookieValue.set({ name, value, ...options });
          },
          async remove(name: string, options: Record<string, unknown>) {
            const cookieValue = await cookieStore;
            cookieValue.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', request.url));
} 