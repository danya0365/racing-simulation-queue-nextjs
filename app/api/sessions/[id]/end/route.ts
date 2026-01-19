/**
 * End Session API Route
 * 
 * POST /api/sessions/[id]/end - End session
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/sessions/[id]/end
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    
    const session = await repository.endSession({
      sessionId: id,
      totalAmount: body.totalAmount,
    });
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ไม่สามารถจบ session ได้' },
      { status: 500 }
    );
  }
}
