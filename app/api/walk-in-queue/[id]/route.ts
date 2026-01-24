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

// PUT /api/walk-in-queue/[id] - Update or Cancel queue
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { id } = await params;
    const body = await request.json();
    
    // Handle cancel
    if (body.action === 'cancel') {
        const customerId = body.customerId;
        await repository.cancel(id, customerId);
        return NextResponse.json({ success: true });
    }
    
    // TODO: Handle other updates if needed
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error updating walk-in queue:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถดำเนินการได้' },
      { status: 500 }
    );
  }
}
