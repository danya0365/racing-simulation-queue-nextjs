/**
 * Queue Search API Route
 * GET /api/queues/search - Search queues by phone
 */

import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const customerId = searchParams.get('customerId');

    if (!phone) {
      return NextResponse.json(
        { error: 'กรุณาระบุเบอร์โทรศัพท์' },
        { status: 400 }
      );
    }

    const queues = await repo.searchByPhone(phone, customerId || undefined);
    return NextResponse.json(queues);
  } catch (error) {
    console.error('Error searching queues:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถค้นหาคิวได้' },
      { status: 500 }
    );
  }
}
