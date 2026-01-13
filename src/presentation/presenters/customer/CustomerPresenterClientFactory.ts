/**
 * CustomerPresenterClientFactory
 * Factory for creating CustomerPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { CustomerPresenter } from './CustomerPresenter';

export class CustomerPresenterClientFactory {
  static create(): CustomerPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const machineRepository = new ApiMachineRepository();
    const queueRepository = new ApiQueueRepository();

    return new CustomerPresenter(machineRepository, queueRepository);
  }
}

export function createClientCustomerPresenter(): CustomerPresenter {
  return CustomerPresenterClientFactory.create();
}
