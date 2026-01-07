/**
 * HomePresenterClientFactory
 * Factory for creating HomePresenter instances on the client side
 * ✅ Injects the appropriate repository (Mock or Real)
 */

'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { HomePresenter } from './HomePresenter';

export class HomePresenterClientFactory {
  static create(): HomePresenter {
    // ✅ Use Mock Repositories for development
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    // ⏳ TODO: Switch to Supabase Repositories when backend is ready
    // const supabase = createClientSupabaseClient();
    // const machineRepository = new SupabaseMachineRepository(supabase);
    // const queueRepository = new SupabaseQueueRepository(supabase);

    return new HomePresenter(machineRepository, queueRepository);
  }
}

export function createClientHomePresenter(): HomePresenter {
  return HomePresenterClientFactory.create();
}
