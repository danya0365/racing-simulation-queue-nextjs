/**
 * TimeBookingPresenterClientFactory
 * Factory for creating TimeBookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiAdvanceBookingRepository } from '@/src/infrastructure/repositories/api/ApiAdvanceBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { TimeBookingPresenter } from './TimeBookingPresenter';

export class TimeBookingPresenterClientFactory {
  static create(): TimeBookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const advanceBookingRepository = new ApiAdvanceBookingRepository();
    const machineRepository = new ApiMachineRepository();

    return new TimeBookingPresenter(advanceBookingRepository, machineRepository);
  }
}

export function createClientTimeBookingPresenter(): TimeBookingPresenter {
  return TimeBookingPresenterClientFactory.create();
}
