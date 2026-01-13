/**
 * Queues API Route
 * GET /api/queues - Get all queues (with filters)
 * POST /api/queues - Create queue
 */

import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const machineId = searchParams.get('machineId');
    const todayDate = searchParams.get('todayDate');
    const referenceTime = searchParams.get('referenceTime');
    const ids = searchParams.get('ids');

    // Get by IDs
    if (ids) {
      const idsArray = ids.split(',');
      const queues = await repo.getByIds(idsArray);
      return NextResponse.json(queues);
    }

    // Get by IDs with status (RPC)
    if (action === 'withStatus' && ids) {
      const idsArray = ids.split(',');
      const queues = await repo.getByIdsWithStatus(idsArray);
      return NextResponse.json(queues);
    }

    // Get waiting queues
    if (action === 'waiting') {
      const queues = await repo.getWaiting();
      return NextResponse.json(queues);
    }

    // Get today's queues
    if (action === 'today' && todayDate) {
      const queues = await repo.getToday(todayDate);
      return NextResponse.json(queues);
    }

    // Get active and recent
    if (action === 'activeAndRecent' && referenceTime) {
      const queues = await repo.getActiveAndRecent(referenceTime);
      return NextResponse.json(queues);
    }

    // Get by machine ID
    if (machineId) {
      const queues = await repo.getByMachineId(machineId);
      return NextResponse.json(queues);
    }

    // Get next position
    if (action === 'nextPosition' && machineId) {
      const position = await repo.getNextPosition(machineId);
      return NextResponse.json({ position });
    }

    // Default: get all queues
    const queues = await repo.getAll();
    return NextResponse.json(queues);
  } catch (error) {
    console.error('Error fetching queues:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลคิวได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseQueueRepository(supabase);

    const data = await request.json();
    const queue = await repo.create(data);
    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error('Error creating queue:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างคิวได้' },
      { status: 500 }
    );
  }
}
