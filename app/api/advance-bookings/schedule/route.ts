/**
 * Advance Booking Schedule API Route
 * GET /api/advance-bookings/schedule - Get day schedule for machine
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const date = searchParams.get('date');
    const referenceTime = searchParams.get('referenceTime');

    if (!machineId || !date) {
      return NextResponse.json(
        { error: 'กรุณาระบุ machineId และ date' },
        { status: 400 }
      );
    }

    const schedule = await repo.getDaySchedule(machineId, date, referenceTime || undefined);
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดตารางได้' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/advance-bookings/schedule - Check slot availability
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const { machineId, date, startTime, duration, referenceTime } = await request.json();

    if (!machineId || !date || !startTime || !duration) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบ' },
        { status: 400 }
      );
    }

    const isAvailable = await repo.isSlotAvailable(machineId, date, startTime, duration, referenceTime);
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking slot:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถตรวจสอบสล็อตได้' },
      { status: 500 }
    );
  }
}
