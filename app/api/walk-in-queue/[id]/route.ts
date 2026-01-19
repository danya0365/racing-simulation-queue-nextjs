/**
 * Walk-In Queue Individual Item API Routes
 * 
 * GET /api/walk-in-queue/[id] - Get queue by ID
 * DELETE /api/walk-in-queue/[id] - Cancel queue
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/walk-in-queue/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { id } = await params;
    const queue = await repository.getById(id);
    
    if (!queue) {
      return NextResponse.json(
        { error: 'ไม่พบคิว' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error fetching walk-in queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูลคิว' },
      { status: 500 }
    );
  }
}

// DELETE /api/walk-in-queue/[id] - Cancel queue
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customerId = body.customerId;
    
    await repository.cancel(id, customerId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling walk-in queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถยกเลิกคิวได้' },
      { status: 500 }
    );
  }
}
