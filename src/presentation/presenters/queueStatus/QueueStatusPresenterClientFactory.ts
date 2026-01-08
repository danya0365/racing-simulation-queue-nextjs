/**
 * QueueStatusPresenterClientFactory
 * Factory for creating QueueStatusPresenter instances on the client side
 * ✅ Injects the appropriate repository (Mock or Real)
 */

'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { QueueStatusPresenter } from './QueueStatusPresenter';

export class QueueStatusPresenterClientFactory {
  static create(): QueueStatusPresenter {
    // ✅ Use Mock Repository for development
    const queueRepository = new MockQueueRepository();
    const machineRepository = new MockMachineRepository();
    
    // ⏳ TODO: Switch to Supabase Repository when backend is ready
    // const supabase = createClientSupabaseClient();
    // const queueRepository = new SupabaseQueueRepository(supabase);
    // const machineRepository = new SupabaseMachineRepository(supabase);

    return new QueueStatusPresenter(queueRepository, machineRepository);
  }
}

export function createClientQueueStatusPresenter(): QueueStatusPresenter {
  return QueueStatusPresenterClientFactory.create();
}
