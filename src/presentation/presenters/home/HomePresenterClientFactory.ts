/**
 * HomePresenterClientFactory
 * Factory for creating HomePresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { HomePresenter } from './HomePresenter';

export class HomePresenterClientFactory {
  static create(): HomePresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const machineRepository = new ApiMachineRepository();
    const queueRepository = new ApiQueueRepository();

    return new HomePresenter(machineRepository, queueRepository);
  }
}

export function createClientHomePresenter(): HomePresenter {
  return HomePresenterClientFactory.create();
}

