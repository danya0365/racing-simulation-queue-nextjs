/**
 * AdvanceBookingPresenterClientFactory
 * Factory for creating AdvanceBookingPresenter instances on the client side
 */

'use client';

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { AdvanceBookingPresenter } from './AdvanceBookingPresenter';

export class AdvanceBookingPresenterClientFactory {
  static create(): AdvanceBookingPresenter {
    // ✅ Use Supabase Repositories
    const supabase = createClient();
    const advanceBookingRepo = new SupabaseAdvanceBookingRepository(supabase);
    const machineRepo = new SupabaseMachineRepository(supabase);

    return new AdvanceBookingPresenter(advanceBookingRepo, machineRepo);
  }
}

export function createClientAdvanceBookingPresenter(): AdvanceBookingPresenter {
  return AdvanceBookingPresenterClientFactory.create();
}
