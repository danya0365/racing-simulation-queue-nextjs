/**
 * QueueStatusPresenterClientFactory
 * Factory for creating QueueStatusPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Uses new IWalkInQueueRepository
 */

'use client';

import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiWalkInQueueRepository } from '@/src/infrastructure/repositories/api/ApiWalkInQueueRepository';
import { QueueStatusPresenter } from './QueueStatusPresenter';

export class QueueStatusPresenterClientFactory {
  static create(): QueueStatusPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const walkInQueueRepository = new ApiWalkInQueueRepository();
    const machineRepository = new ApiMachineRepository();

    return new QueueStatusPresenter(walkInQueueRepository, machineRepository);
  }
}

export function createClientQueueStatusPresenter(): QueueStatusPresenter {
  return QueueStatusPresenterClientFactory.create();
}
