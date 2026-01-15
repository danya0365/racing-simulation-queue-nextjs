/**
 * BookingPresenterServerFactory
 * Factory for creating BookingPresenter instances on the server side
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { BookingPresenter } from './BookingPresenter';

export class BookingPresenterServerFactory {
  static async create(): Promise<BookingPresenter> {
    // ✅ Use Supabase Repositories
    // ✅ Using new SupabaseBookingRepository (TIMESTAMPTZ-based)
    const supabase = await createClient();
    const bookingRepo = new SupabaseBookingRepository(supabase);
    const machineRepo = new SupabaseMachineRepository(supabase);

    return new BookingPresenter(bookingRepo, machineRepo);
  }
}

export async function createServerBookingPresenter(): Promise<BookingPresenter> {
  return BookingPresenterServerFactory.create();
}
