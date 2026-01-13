/**
 * BackendPresenterClientFactory
 * Factory for creating BackendPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterClientFactory {
  static create(): BackendPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const machineRepository = new ApiMachineRepository();
    const queueRepository = new ApiQueueRepository();

    return new BackendPresenter(machineRepository, queueRepository);
  }
}

export function createClientBackendPresenter(): BackendPresenter {
  return BackendPresenterClientFactory.create();
}

