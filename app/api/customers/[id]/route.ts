/**
 * Customer by ID API Route
 * GET /api/customers/[id] - Get customer by ID
 * PUT /api/customers/[id] - Update customer
 * DELETE /api/customers/[id] - Delete customer
 */

import { SupabaseCustomerRepository } from '@/src/infrastructure/repositories/supabase/SupabaseCustomerRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseCustomerRepository(supabase);

    const customer = await repo.getById(id);
    if (!customer) {
      return NextResponse.json(
        { error: 'ไม่พบลูกค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลลูกค้าได้' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseCustomerRepository(supabase);

    const data = await request.json();

    // Handle increment visit action
    if (data.action === 'incrementVisit') {
      const customer = await repo.incrementVisit(id, data.playTime || 0, data.now);
      return NextResponse.json(customer);
    }

    const customer = await repo.update(id, data);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตลูกค้าได้' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const repo = new SupabaseCustomerRepository(supabase);

    const success = await repo.delete(id);
    if (!success) {
      return NextResponse.json(
        { error: 'ไม่สามารถลบลูกค้าได้' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบลูกค้าได้' },
      { status: 500 }
    );
  }
}
