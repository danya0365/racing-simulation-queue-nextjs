/**
 * CustomerPresenterClientFactory
 * Factory for creating CustomerPresenter instances on the client side
 */

'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { CustomerPresenter } from './CustomerPresenter';

export class CustomerPresenterClientFactory {
  static create(): CustomerPresenter {
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    return new CustomerPresenter(machineRepository, queueRepository);
  }
}

export function createClientCustomerPresenter(): CustomerPresenter {
  return CustomerPresenterClientFactory.create();
}
