/**
 * Queue Stats API Route
 * GET /api/queues/stats - Get queue statistics
 */

import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const { searchParams } = new URL(request.url);
    const todayDate = searchParams.get('todayDate');
    const action = searchParams.get('action');

    // Backend stats (RPC)
    if (action === 'backend') {
      const stats = await repo.getBackendStats();
      return NextResponse.json(stats);
    }

    // Regular stats
    if (!todayDate) {
      return NextResponse.json(
        { error: 'กรุณาระบุวันที่' },
        { status: 400 }
      );
    }

    const stats = await repo.getStats(todayDate);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดสถิติได้' },
      { status: 500 }
    );
  }
}
