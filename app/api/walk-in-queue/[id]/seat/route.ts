/**
 * Seat Customer API Route
 * 
 * POST /api/walk-in-queue/[id]/seat - Seat customer (called -> seated)
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/walk-in-queue/[id]/seat
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { id } = await params;
    const body = await request.json();
    const machineId = body.machineId;
    
    if (!machineId) {
      return NextResponse.json(
        { error: 'กรุณาระบุเครื่อง' },
        { status: 400 }
      );
    }
    
    const queue = await repository.seatCustomer({
      queueId: id,
      machineId,
    });
    
    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error seating customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถจัดที่นั่งได้' },
      { status: 500 }
    );
  }
}
