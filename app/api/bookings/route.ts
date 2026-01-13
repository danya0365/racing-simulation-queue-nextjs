/**
 * Advance Bookings API Route
 * GET /api/advance-bookings - Get bookings (with filters)
 * POST /api/advance-bookings - Create booking
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const machineId = searchParams.get('machineId');
    const date = searchParams.get('date');

    // Get stats
    if (action === 'stats') {
      const stats = await repo.getStats();
      return NextResponse.json(stats);
    }

    // Get available dates
    if (action === 'availableDates') {
      const todayStr = searchParams.get('todayStr') || new Date().toISOString().split('T')[0];
      const daysAhead = parseInt(searchParams.get('daysAhead') || '7');
      const dates = await repo.getAvailableDates(todayStr, daysAhead);
      return NextResponse.json(dates);
    }

    // Get by machine and date
    if (machineId && date) {
      const bookings = await repo.getByMachineAndDate(machineId, date);
      return NextResponse.json(bookings);
    }

    // Default: return error (no generic getAll for security)
    return NextResponse.json(
      { error: 'กรุณาระบุ machineId และ date' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching advance bookings:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const data = await request.json();
    const booking = await repo.create(data);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating advance booking:', error);
    const message = error instanceof Error ? error.message : 'ไม่สามารถสร้างการจองได้';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
