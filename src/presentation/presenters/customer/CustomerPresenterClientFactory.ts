import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { supabase } from '@/src/infrastructure/supabase/client';
import { CustomerPresenter } from './CustomerPresenter';

export class CustomerPresenterClientFactory {
  static create(): CustomerPresenter {
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);

    return new CustomerPresenter(machineRepository, queueRepository);
  }
}

export function createClientCustomerPresenter(): CustomerPresenter {
  return CustomerPresenterClientFactory.create();
}
