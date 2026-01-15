/**
 * Booking Schedule API Route
 * GET /api/bookings/schedule - Get day schedule for machine
 * POST /api/bookings/schedule - Check slot availability
 * 
 * Uses the TIMESTAMPTZ-based booking system
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');
    const date = searchParams.get('date');
    const timezone = searchParams.get('timezone') || 'Asia/Bangkok';
    const referenceTime = searchParams.get('referenceTime');
    const customerId = searchParams.get('customerId'); // For privacy: show full phone for owner

    if (!machineId || !date) {
      return NextResponse.json(
        { error: 'กรุณาระบุ machineId และ date' },
        { status: 400 }
      );
    }

    const schedule = await repo.getDaySchedule(
      machineId, 
      date, 
      timezone, 
      referenceTime || undefined,
      customerId || undefined
    );
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดตารางได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const { machineId, date, startTime, durationMinutes, timezone } = await request.json();

    if (!machineId || !date || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อมูลให้ครบ' },
        { status: 400 }
      );
    }

    const isAvailable = await repo.isSlotAvailable(
      machineId, 
      date, 
      startTime, 
      durationMinutes, 
      timezone || 'Asia/Bangkok'
    );
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking slot:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถตรวจสอบสล็อตได้' },
      { status: 500 }
    );
  }
}
