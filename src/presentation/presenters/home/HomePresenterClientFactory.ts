import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { supabase } from '@/src/infrastructure/supabase/client';
import { HomePresenter } from './HomePresenter';

export class HomePresenterClientFactory {
  static create(): HomePresenter {
    
    // ✅ Using Supabase Repositories for production/real data
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);

    return new HomePresenter(machineRepository, queueRepository);
  }
}

export function createClientHomePresenter(): HomePresenter {
  return HomePresenterClientFactory.create();
}
