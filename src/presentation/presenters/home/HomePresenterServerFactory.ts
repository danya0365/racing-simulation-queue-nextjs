/**
 * HomePresenterServerFactory
 * Factory for creating HomePresenter instances on the server side
 * ✅ Injects the appropriate repository (Mock or Real)
 */

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { HomePresenter } from './HomePresenter';

export class HomePresenterServerFactory {
  static create(): HomePresenter {
    // ✅ Use Mock Repositories for development
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    // ⏳ TODO: Switch to Supabase Repositories when backend is ready
    // const supabase = createServerSupabaseClient();
    // const machineRepository = new SupabaseMachineRepository(supabase);
    // const queueRepository = new SupabaseQueueRepository(supabase);

    return new HomePresenter(machineRepository, queueRepository);
  }
}

export function createServerHomePresenter(): HomePresenter {
  return HomePresenterServerFactory.create();
}
