/**
 * BackendPresenterClientFactory
 * Factory for creating BackendPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

'use client';

import { ApiBookingRepository } from '@/src/infrastructure/repositories/api/ApiBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';
import { BackendPresenter } from './BackendPresenter';

export class BackendPresenterClientFactory {
  static create(): BackendPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    // ✅ Using new IBookingRepository (TIMESTAMPTZ-based)
    const machineRepository = new ApiMachineRepository();
    const queueRepository = new ApiQueueRepository();
    const bookingRepository = new ApiBookingRepository();

    return new BackendPresenter(machineRepository, queueRepository, bookingRepository);
  }
}

export function createClientBackendPresenter(): BackendPresenter {
  return BackendPresenterClientFactory.create();
}
