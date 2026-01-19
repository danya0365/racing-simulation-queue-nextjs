/**
 * Session Stats API Route
 * 
 * GET /api/sessions/stats - Get session statistics
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions/stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let stats;
    
    if (startDate && endDate) {
      stats = await repository.getStats({ start: startDate, end: endDate });
    } else {
      stats = await repository.getStats();
    }
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถโหลดสถิติ sessions ได้' },
      { status: 500 }
    );
  }
}
