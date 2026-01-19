/**
 * Today Sessions API Route
 * 
 * GET /api/sessions/today - Get all sessions for today
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions/today
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const sessions = await repository.getTodaySessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching today sessions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล sessions' },
      { status: 500 }
    );
  }
}
