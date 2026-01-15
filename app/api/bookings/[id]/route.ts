/**
 * Booking By ID API Route
 * GET /api/bookings/[id] - Get booking by ID
 * PUT /api/bookings/[id] - Update or cancel booking
 * 
 * Uses the TIMESTAMPTZ-based booking system
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const booking = await repo.getById(id);
    if (!booking) {
      return NextResponse.json(
        { error: 'ไม่พบการจอง' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลการจองได้' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const repo = new SupabaseBookingRepository(supabase);

    const data = await request.json();

    // Handle cancel action
    if (data.action === 'cancel') {
      const success = await repo.cancel(id, data.customerId);
      return NextResponse.json({ success });
    }

    // Handle update
    const booking = await repo.update(id, data);
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error updating booking:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตการจอง';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
