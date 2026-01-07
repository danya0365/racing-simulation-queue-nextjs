/**
 * BackendPresenterServerFactory
 * Factory for creating BackendPresenter instances on the server side
 */

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterServerFactory {
  static create(): BackendPresenter {
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    return new BackendPresenter(machineRepository, queueRepository);
  }
}

export function createServerBackendPresenter(): BackendPresenter {
  return BackendPresenterServerFactory.create();
}
