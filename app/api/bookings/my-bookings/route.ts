/**
 * My Bookings API Route
 * GET /api/bookings/my-bookings - Get bookings by customer_id
 * 
 * SECURE: Only returns bookings that belong to the provided customer_id
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ customerId' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customerId)) {
      return NextResponse.json(
        { error: 'customerId ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const bookings = await repo.getMyBookings(customerId);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้' },
      { status: 500 }
    );
  }
}
