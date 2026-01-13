/**
 * QuickAdvanceBookingPresenterClientFactory
 * Factory for creating QuickAdvanceBookingPresenter instances on the client side
 * ✅ Injects the Supabase Repositories
 */

'use client';

import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { QuickAdvanceBookingPresenter } from './QuickAdvanceBookingPresenter';

export class QuickAdvanceBookingPresenterClientFactory {
  static create(): QuickAdvanceBookingPresenter {
    // ✅ Using createClient() for proper singleton access
    const supabase = createClient();
    const advanceBookingRepository = new SupabaseAdvanceBookingRepository(supabase);
    const machineRepository = new SupabaseMachineRepository(supabase);

    return new QuickAdvanceBookingPresenter(advanceBookingRepository, machineRepository);
  }
}

export function createClientQuickAdvanceBookingPresenter(): QuickAdvanceBookingPresenter {
  return QuickAdvanceBookingPresenterClientFactory.create();
}
