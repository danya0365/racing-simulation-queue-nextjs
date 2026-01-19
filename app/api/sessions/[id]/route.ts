/**
 * Session Individual Item API Routes
 * 
 * GET /api/sessions/[id] - Get session by ID
 */

import { SupabaseSessionRepository } from '@/src/infrastructure/repositories/supabase/SupabaseSessionRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/sessions/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const repository = new SupabaseSessionRepository(supabase);
    
    const { id } = await params;
    const session = await repository.getById(id);
    
    if (!session) {
      return NextResponse.json(
        { error: 'ไม่พบ session' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล session' },
      { status: 500 }
    );
  }
}
