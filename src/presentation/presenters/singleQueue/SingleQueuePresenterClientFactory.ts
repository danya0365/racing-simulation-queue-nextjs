'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { SingleQueuePresenter } from './SingleQueuePresenter';

export class SingleQueuePresenterClientFactory {
  static create(): SingleQueuePresenter {
    const queueRepository = new MockQueueRepository();
    const machineRepository = new MockMachineRepository();
    
    return new SingleQueuePresenter(queueRepository, machineRepository);
  }
}

export function createClientSingleQueuePresenter(): SingleQueuePresenter {
  return SingleQueuePresenterClientFactory.create();
}
