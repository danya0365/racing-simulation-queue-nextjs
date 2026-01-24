/**
 * Booking API Route
 * GET /api/bookings - Get bookings or available dates
 * POST /api/bookings - Create a new booking
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
    const action = searchParams.get('action');
    const machineId = searchParams.get('machineId');
    const date = searchParams.get('date');
    const todayStr = searchParams.get('todayStr');
    const daysAhead = searchParams.get('daysAhead');

    // Get available dates
    if (action === 'availableDates' && todayStr) {
      const dates = await repo.getAvailableDates(todayStr, daysAhead ? parseInt(daysAhead) : 7);
      return NextResponse.json(dates);
    }

    // Get stats
    if (action === 'stats') {
      const stats = await repo.getStats();
      return NextResponse.json(stats);
    }

    // Get bookings for machine and date
    if (machineId && date) {
      const customerId = searchParams.get('customerId');
      const bookings = await repo.getByMachineAndDate(machineId, date, customerId || undefined);
      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: 'กรุณาระบุพารามิเตอร์ที่ต้องการ' }, { status: 400 });
  } catch (error) {
    console.error('Error in bookings API:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const data = await request.json();

    // Validate required fields
    if (!data.machineId || !data.customerName || !data.customerPhone || !data.localDate || !data.localStartTime || !data.durationMinutes) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const booking = await repo.create({
      machineId: data.machineId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      localDate: data.localDate,
      localStartTime: data.localStartTime,
      durationMinutes: data.durationMinutes,
      timezone: data.timezone,
      notes: data.notes,
      customerId: data.customerId || '',
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างการจอง';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
