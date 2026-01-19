/**
 * Walk-In Queue My Status API Route
 * 
 * GET /api/walk-in-queue/my-status - Get customer's queue status
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/walk-in-queue/my-status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'กรุณาระบุ customerId' },
        { status: 400 }
      );
    }
    
    const queues = await repository.getMyQueueStatus(customerId);
    
    return NextResponse.json(queues);
  } catch (error) {
    console.error('Error fetching my queue status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถโหลดสถานะคิวได้' },
      { status: 500 }
    );
  }
}
