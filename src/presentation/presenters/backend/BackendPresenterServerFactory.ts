/**
 * BackendPresenterServerFactory
 * Factory for creating BackendPresenter instances on the server side
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

import { SupabaseBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterServerFactory {
  static async create(): Promise<BackendPresenter> {
    const supabase = await createClient();
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);
    const bookingRepository = new SupabaseBookingRepository(supabase);

    return new BackendPresenter(machineRepository, queueRepository, bookingRepository);
  }
}

export async function createServerBackendPresenter(): Promise<BackendPresenter> {
  return await BackendPresenterServerFactory.create();
}
