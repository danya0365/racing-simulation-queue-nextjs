import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterServerFactory {
  static async create(): Promise<BackendPresenter> {
    const supabase = await createClient();
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);
    const advanceBookingRepository = new SupabaseAdvanceBookingRepository(supabase);

    return new BackendPresenter(machineRepository, queueRepository, advanceBookingRepository);
  }
}

export async function createServerBackendPresenter(): Promise<BackendPresenter> {
  return await BackendPresenterServerFactory.create();
}
