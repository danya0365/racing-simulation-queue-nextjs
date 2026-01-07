/**
 * BackendPresenterClientFactory
 * Factory for creating BackendPresenter instances on the client side
 */

'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterClientFactory {
  static create(): BackendPresenter {
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();

    return new BackendPresenter(machineRepository, queueRepository);
  }
}

export function createClientBackendPresenter(): BackendPresenter {
  return BackendPresenterClientFactory.create();
}
