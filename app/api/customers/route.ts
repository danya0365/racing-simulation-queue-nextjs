/**
 * Customers API Route
 * GET /api/customers - Get all customers (with filters)
 * POST /api/customers - Create customer
 */

import { SupabaseCustomerRepository } from '@/src/infrastructure/repositories/supabase/SupabaseCustomerRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseCustomerRepository(supabase);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const phone = searchParams.get('phone');
    const query = searchParams.get('query');
    const todayDate = searchParams.get('todayDate');

    // Get stats
    if (action === 'stats' && todayDate) {
      const stats = await repo.getStats(todayDate);
      return NextResponse.json(stats);
    }

    // Get VIP customers
    if (action === 'vip') {
      const customers = await repo.getVipCustomers();
      return NextResponse.json(customers);
    }

    // Get frequent customers
    if (action === 'frequent') {
      const customers = await repo.getFrequentCustomers();
      return NextResponse.json(customers);
    }

    // Get by phone
    if (phone) {
      const customer = await repo.getByPhone(phone);
      return NextResponse.json(customer);
    }

    // Default: get all customers (paginated)
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || searchParams.get('query') || undefined;
    const filter = searchParams.get('filter') || undefined;

    const result = await repo.getAll(limit, page, search, filter);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลลูกค้าได้' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseCustomerRepository(supabase);

    const data = await request.json();
    const customer = await repo.create(data);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถสร้างลูกค้าได้' },
      { status: 500 }
    );
  }
}
