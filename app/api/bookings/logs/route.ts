import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Session Logs API Route
 * POST /api/bookings/logs - Log a session action
 * GET /api/bookings/logs - Get session logs
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);
    
    const { bookingId, action } = await request.json();
    
    if (!bookingId || !action) {
      return NextResponse.json(
        { error: 'กรุณาระบุ bookingId และ action' },
        { status: 400 }
      );
    }

    await repo.logSession(bookingId, action);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging session:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกเซสชันได้' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseAdvanceBookingRepository(supabase);
    
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json([]);
    }

    const bookingIds = idsParam.split(',');
    const logs = await repo.getSessionLogs(bookingIds);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลด logs ได้' },
      { status: 500 }
    );
  }
}
