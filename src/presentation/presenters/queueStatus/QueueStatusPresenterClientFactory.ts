import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { supabase } from '@/src/infrastructure/supabase/client';
import { QueueStatusPresenter } from './QueueStatusPresenter';

export class QueueStatusPresenterClientFactory {
  static create(): QueueStatusPresenter {
    const queueRepository = new SupabaseQueueRepository(supabase);
    const machineRepository = new SupabaseMachineRepository(supabase);

    return new QueueStatusPresenter(queueRepository, machineRepository);
  }
}

export function createClientQueueStatusPresenter(): QueueStatusPresenter {
  return QueueStatusPresenterClientFactory.create();
}
