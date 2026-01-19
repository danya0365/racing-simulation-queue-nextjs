/**
 * Walk-In Queue Next Number API Route
 * 
 * GET /api/walk-in-queue/next-number - Get next queue number
 */

import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/walk-in-queue/next-number
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseWalkInQueueRepository(supabase);
    
    const nextNumber = await repository.getNextQueueNumber();
    
    return NextResponse.json({ nextNumber });
  } catch (error) {
    console.error('Error fetching next queue number:', error);
    return NextResponse.json(
      { nextNumber: 1 },
      { status: 200 } // Return default value on error
    );
  }
}
