/**
 * QueueStatusPresenterClientFactory
 * Factory for creating QueueStatusPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { QueueStatusPresenter } from './QueueStatusPresenter';

export class QueueStatusPresenterClientFactory {
  static create(): QueueStatusPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const queueRepository = new ApiQueueRepository();
    const machineRepository = new ApiMachineRepository();

    return new QueueStatusPresenter(queueRepository, machineRepository);
  }
}

export function createClientQueueStatusPresenter(): QueueStatusPresenter {
  return QueueStatusPresenterClientFactory.create();
}
