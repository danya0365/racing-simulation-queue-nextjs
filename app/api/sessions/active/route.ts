/**
 * Active Sessions API Route
 * 
 * GET /api/sessions/active - Get all active sessions or by stationId
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions/active
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    
    if (stationId) {
      const session = await repository.getActiveSession(stationId);
      if (!session) {
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json(session);
    }
    
    const sessions = await repository.getActiveSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล sessions' },
      { status: 500 }
    );
  }
}
