import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getWeekStart(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday as start of week
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function POST(request: Request) {
  try {
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

    // Fetch all bookmarks (id, UID, created_at)
    const { data: allBookmarks, error: allBookmarksError } = await supabase
      .from('collection')
      .select('id, UID, created_at')
      .order('UID', { ascending: true })
      .order('created_at', { ascending: true });

    if (allBookmarksError) {
      console.error('Error fetching all bookmarks:', allBookmarksError);
      return NextResponse.json(
        { error: 'Failed to fetch all bookmarks', details: allBookmarksError },
        { status: 500 }
      );
    }

    // Group bookmarks by user and week, and assign running count
    const updates = [];
    const userWeekMap = new Map(); // Map<UID, Map<weekStart, count>>

    for (const bookmark of allBookmarks || []) {
      const uid = bookmark.UID;
      const createdAt = new Date(bookmark.created_at);
      const weekStart = getWeekStart(createdAt);
      if (!userWeekMap.has(uid)) userWeekMap.set(uid, new Map());
      const weekMap = userWeekMap.get(uid);
      const prevCount = weekMap.get(weekStart) || 0;
      const newCount = prevCount + 1;
      weekMap.set(weekStart, newCount);
      updates.push({ id: bookmark.id, wkcnt: newCount });
    }

    // Update all bookmarks with their new wkcnt
    let updatedCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('collection')
        .update({ wkcnt: update.wkcnt })
        .eq('id', update.id);
      if (!updateError) updatedCount++;
      else console.error(`Error updating bookmark ${update.id}:`, updateError);
    }

    return NextResponse.json({
      message: 'Weekly running counts updated successfully',
      updatedBookmarks: updatedCount,
      totalBookmarks: allBookmarks?.length || 0
    });
  } catch (error) {
    console.error('Error updating weekly running counts:', error);
    return NextResponse.json(
      { error: 'Failed to update weekly running counts', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 