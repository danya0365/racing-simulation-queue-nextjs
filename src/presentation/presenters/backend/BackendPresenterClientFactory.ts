/**
 * BackendPresenterClientFactory
 * Factory for creating BackendPresenter instances on the client side
 */

'use client';

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterClientFactory {
  static create(): BackendPresenter {
    const supabase = createClient();
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);

    return new BackendPresenter(machineRepository, queueRepository);
  }
}

export function createClientBackendPresenter(): BackendPresenter {
  return BackendPresenterClientFactory.create();
}
