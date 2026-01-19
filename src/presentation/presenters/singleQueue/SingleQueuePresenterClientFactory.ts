/**
 * SingleQueuePresenterClientFactory
 * Factory for creating SingleQueuePresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Uses new IWalkInQueueRepository
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiWalkInQueueRepository } from '@/src/infrastructure/repositories/api/ApiWalkInQueueRepository';
import { SingleQueuePresenter } from './SingleQueuePresenter';

export class SingleQueuePresenterClientFactory {
  static create(): SingleQueuePresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const walkInQueueRepository = new ApiWalkInQueueRepository();
    const machineRepository = new ApiMachineRepository();

    return new SingleQueuePresenter(walkInQueueRepository, machineRepository);
  }
}

export function createClientSingleQueuePresenter(): SingleQueuePresenter {
  return SingleQueuePresenterClientFactory.create();
}
