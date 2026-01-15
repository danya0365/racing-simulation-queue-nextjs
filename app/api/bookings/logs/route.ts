/**
 * New Booking Logs API Route
 * GET /api/new-bookings/logs - Get session logs for bookings
 * POST /api/new-bookings/logs - Log a session action
 * 
 * Uses the new TIMESTAMPTZ-based booking system
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'กรุณาระบุ booking ids' },
        { status: 400 }
      );
    }

    const ids = idsParam.split(',').filter(Boolean);
    const logs = await repo.getSessionLogs(ids);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลด logs ได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const { bookingId, action } = await request.json();

    if (!bookingId || !action) {
      return NextResponse.json(
        { error: 'กรุณาระบุ bookingId และ action' },
        { status: 400 }
      );
    }

    if (!['START', 'STOP'].includes(action)) {
      return NextResponse.json(
        { error: 'action ต้องเป็น START หรือ STOP' },
        { status: 400 }
      );
    }

    await repo.logSession(bookingId, action);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกเซสชันได้' },
      { status: 500 }
    );
  }
}
