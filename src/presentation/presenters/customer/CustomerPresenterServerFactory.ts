/**
 * CustomerPresenterServerFactory
 * Factory for creating CustomerPresenter instances on the server side
 */

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { CustomerPresenter } from './CustomerPresenter';

export class CustomerPresenterServerFactory {
  static async create(): Promise<CustomerPresenter> {
    const supabase = await createClient();
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);

    return new CustomerPresenter(machineRepository, queueRepository);
  }
}

export async function createServerCustomerPresenter(): Promise<CustomerPresenter> {
  return await CustomerPresenterServerFactory.create();
}
