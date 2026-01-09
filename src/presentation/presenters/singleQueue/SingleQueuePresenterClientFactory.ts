'use client';

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { supabase } from '@/src/infrastructure/supabase/client';
import { SingleQueuePresenter } from './SingleQueuePresenter';

export class SingleQueuePresenterClientFactory {
  static create(): SingleQueuePresenter {
    const queueRepository = new SupabaseQueueRepository(supabase);
    const machineRepository = new SupabaseMachineRepository(supabase);
    
    return new SingleQueuePresenter(queueRepository, machineRepository);
  }
}

export function createClientSingleQueuePresenter(): SingleQueuePresenter {
  return SingleQueuePresenterClientFactory.create();
}
