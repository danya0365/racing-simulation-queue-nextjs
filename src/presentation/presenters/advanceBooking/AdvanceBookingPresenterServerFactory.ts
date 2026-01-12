/**
 * AdvanceBookingPresenterServerFactory
 * Factory for creating AdvanceBookingPresenter instances on the server side
 */

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { AdvanceBookingPresenter } from './AdvanceBookingPresenter';

export class AdvanceBookingPresenterServerFactory {
  static async create(): Promise<AdvanceBookingPresenter> {
    // ✅ Use Supabase Repositories
    const supabase = await createClient();
    const advanceBookingRepo = new SupabaseAdvanceBookingRepository(supabase);
    const machineRepo = new SupabaseMachineRepository(supabase);

    return new AdvanceBookingPresenter(advanceBookingRepo, machineRepo);
  }
}

export async function createServerAdvanceBookingPresenter(): Promise<AdvanceBookingPresenter> {
  return AdvanceBookingPresenterServerFactory.create();
}
