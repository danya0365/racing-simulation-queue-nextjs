/**
 * SingleQueuePresenterClientFactory
 * Factory for creating SingleQueuePresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { SingleQueuePresenter } from './SingleQueuePresenter';

export class SingleQueuePresenterClientFactory {
  static create(): SingleQueuePresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const queueRepository = new ApiQueueRepository();
    const machineRepository = new ApiMachineRepository();
    
    return new SingleQueuePresenter(queueRepository, machineRepository);
  }
}

export function createClientSingleQueuePresenter(): SingleQueuePresenter {
  return SingleQueuePresenterClientFactory.create();
}
