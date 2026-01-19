/**
 * Call Customer API Route
 * 
 * POST /api/walk-in-queue/[id]/call - Call customer (waiting -> called)
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/walk-in-queue/[id]/call
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { id } = await params;
    const queue = await repository.callCustomer(id);
    
    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error calling customer:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถเรียกลูกค้าได้' },
      { status: 500 }
    );
  }
}
