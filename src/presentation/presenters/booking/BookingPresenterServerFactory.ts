/**
 * BookingPresenterServerFactory
 * Factory for creating BookingPresenter instances on the server side
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { BookingPresenter } from './BookingPresenter';

export class BookingPresenterServerFactory {
  static async create(): Promise<BookingPresenter> {
    // ✅ Use Supabase Repositories
    const supabase = await createClient();
    const advanceBookingRepo = new SupabaseAdvanceBookingRepository(supabase);
    const machineRepo = new SupabaseMachineRepository(supabase);

    return new BookingPresenter(advanceBookingRepo, machineRepo);
  }
}

export async function createServerBookingPresenter(): Promise<BookingPresenter> {
  return BookingPresenterServerFactory.create();
}
