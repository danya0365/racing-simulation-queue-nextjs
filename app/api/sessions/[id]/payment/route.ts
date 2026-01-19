/**
 * Update Payment Status API Route
 * 
 * PUT /api/sessions/[id]/payment - Update payment status
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/sessions/[id]/payment
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { id } = await params;
    const body = await request.json();
    
    if (!body.status || !['unpaid', 'paid', 'refunded'].includes(body.status)) {
      return NextResponse.json(
        { error: 'กรุณาระบุ status ที่ถูกต้อง (unpaid, paid, refunded)' },
        { status: 400 }
      );
    }
    
    const session = await repository.updatePaymentStatus(id, body.status);
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating payment status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตสถานะการชำระเงินได้' },
      { status: 500 }
    );
  }
}
