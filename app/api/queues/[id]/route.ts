/**
 * Queue by ID API Route
 * GET /api/queues/[id] - Get queue by ID
 * PUT /api/queues/[id] - Update queue
 * DELETE /api/queues/[id] - Delete/Cancel queue
 */

import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const queue = await repo.getById(id);
    if (!queue) {
      return NextResponse.json(
        { error: 'ไม่พบคิว' },
        { status: 404 }
      );
    }

    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error fetching queue:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลคิวได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const data = await request.json();

    // Handle specific actions
    if (data.action === 'updateStatus' && data.status) {
      const queue = await repo.updateStatus(id, data.status);
      return NextResponse.json(queue);
    }

    if (data.action === 'cancel') {
      const success = await repo.cancel(id, data.customerId);
      return NextResponse.json({ success });
    }

    const queue = await repo.update(id, data);
    return NextResponse.json(queue);
  } catch (error) {
    console.error('Error updating queue:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตคิวได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const success = await repo.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบคิวได้' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting queue:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบคิวได้' },
      { status: 500 }
    );
  }
}
