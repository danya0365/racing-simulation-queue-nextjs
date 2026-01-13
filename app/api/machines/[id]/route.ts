/**
 * Machine by ID API Route
 * GET /api/machines/[id] - Get machine by ID
 * PUT /api/machines/[id] - Update machine
 * DELETE /api/machines/[id] - Delete machine
 */

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseMachineRepository(supabase);

    const machine = await repo.getById(id);
    if (!machine) {
      return NextResponse.json(
        { error: 'ไม่พบเครื่อง' },
        { status: 404 }
      );
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลเครื่องได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseMachineRepository(supabase);

    const data = await request.json();

    // Check if it's a status update
    if (data.action === 'updateStatus' && data.status) {
      const machine = await repo.updateStatus(id, data.status);
      return NextResponse.json(machine);
    }

    const machine = await repo.update(id, data);
    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error updating machine:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตเครื่องได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseMachineRepository(supabase);

    const success = await repo.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบเครื่องได้' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting machine:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบเครื่องได้' },
      { status: 500 }
    );
  }
}
