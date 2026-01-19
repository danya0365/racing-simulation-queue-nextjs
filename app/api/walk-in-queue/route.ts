/**
 * Walk-In Queue API Routes
 * 
 * GET /api/walk-in-queue - Get all queues or filter by status/customerId
 * POST /api/walk-in-queue - Join walk-in queue
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/walk-in-queue
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    
    let queues;
    
    if (status === 'waiting') {
      queues = await repository.getWaiting();
    } else if (customerId) {
      queues = await repository.getByCustomerId(customerId);
    } else {
      queues = await repository.getAll();
    }
    
    return NextResponse.json(queues);
  } catch (error) {
    console.error('Error fetching walk-in queues:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลคิว' },
      { status: 500 }
    );
  }
}

// POST /api/walk-in-queue - Join queue
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const body = await request.json();
    
    const queue = await repository.join({
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      partySize: body.partySize || 1,
      preferredStationType: body.preferredStationType,
      preferredMachineId: body.preferredMachineId,
      notes: body.notes,
    });
    
    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error('Error joining walk-in queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถเข้าคิวได้' },
      { status: 500 }
    );
  }
}
