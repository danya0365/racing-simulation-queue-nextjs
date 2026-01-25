/**
 * Sessions API Routes
 * 
 * GET /api/sessions - Get all sessions or filter by stationId/dateRange
 * POST /api/sessions - Start new session
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitParams = searchParams.get('limit');
    const pageParams = searchParams.get('page');
    
    let sessions;
    
    if (stationId) {
      const limit = limitParams ? parseInt(limitParams) : undefined;
      const page = pageParams ? parseInt(pageParams) : undefined;
      sessions = await repository.getByStationId(stationId, limit, page);
    } else if (startDate && endDate) {
      sessions = await repository.getByDateRange(startDate, endDate);
    } else {
      const limit = limitParams ? parseInt(limitParams) : undefined;
      const page = pageParams ? parseInt(pageParams) : undefined;
      sessions = await repository.getAll(limit, page);
    }
    
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Start session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const body = await request.json();
    
    if (!body.stationId || !body.customerName) {
      return NextResponse.json(
        { error: 'กรุณาระบุ stationId และ customerName' },
        { status: 400 }
      );
    }
    
    const session = await repository.startSession({
      stationId: body.stationId,
      customerName: body.customerName,
      bookingId: body.bookingId,
      queueId: body.walkInQueueId || body.queueId,
      notes: body.notes,
      estimatedDurationMinutes: body.estimatedDurationMinutes,
    });
    
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error starting session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถเริ่ม session ได้' },
      { status: 500 }
    );
  }
}
