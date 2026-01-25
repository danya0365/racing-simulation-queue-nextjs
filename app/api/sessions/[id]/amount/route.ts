/**
 * Update Session Amount API Route
 * 
 * PUT /api/sessions/[id]/amount - Update session total amount
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/sessions/[id]/amount
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.totalAmount === undefined) {
      return NextResponse.json(
        { error: 'กรุณาระบุยอดเงิน' },
        { status: 400 }
      );
    }
    
    const session = await repository.updateTotalAmount(
      id,
      body.totalAmount
    );
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error updating session amount:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถอัปเดตราคาได้' },
      { status: 500 }
    );
  }
}
