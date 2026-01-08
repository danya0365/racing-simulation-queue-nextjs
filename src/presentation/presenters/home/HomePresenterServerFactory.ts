import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { HomePresenter } from './HomePresenter';

export class HomePresenterServerFactory {
  static async create(): Promise<HomePresenter> {
    const supabase = await createClient();
    
    // ✅ Using Supabase Repositories for production/real data
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);

    return new HomePresenter(machineRepository, queueRepository);
  }
}

export async function createServerHomePresenter(): Promise<HomePresenter> {
  return await HomePresenterServerFactory.create();
}
