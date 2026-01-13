/**
 * Advance Booking by Phone API Route
 * GET /api/advance-bookings/by-phone - Get bookings by customer phone
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json(
        { error: 'กรุณาระบุเบอร์โทร' },
        { status: 400 }
      );
    }

    const bookings = await repo.getByCustomerPhone(phone);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings by phone:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้' },
      { status: 500 }
    );
  }
}
