/**
 * Advance Booking by ID API Route
 * GET /api/advance-bookings/[id] - Get booking by ID
 * PUT /api/advance-bookings/[id] - Update booking
 * DELETE /api/advance-bookings/[id] - Cancel booking
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const booking = await repo.getById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจอง' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching advance booking:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const data = await request.json();

    // Handle cancel action
    if (data.action === 'cancel') {
      const success = await repo.cancel(id);
      return NextResponse.json({ success });
    }

    const booking = await repo.update(id, data);
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating advance booking:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตการจองได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);

    const success = await repo.cancel(id);
    if (!success) {
      return NextResponse.json(
        { error: 'ไม่สามารถยกเลิกการจองได้' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling advance booking:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถยกเลิกการจองได้' },
      { status: 500 }
    );
  }
}
