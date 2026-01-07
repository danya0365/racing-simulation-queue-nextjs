/**
 * CustomerPresenterServerFactory
 * Factory for creating CustomerPresenter instances on the server side
 */

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { CustomerPresenter } from './CustomerPresenter';

export class CustomerPresenterServerFactory {
  static create(): CustomerPresenter {
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    return new CustomerPresenter(machineRepository, queueRepository);
  }
}

export function createServerCustomerPresenter(): CustomerPresenter {
  return CustomerPresenterServerFactory.create();
}
