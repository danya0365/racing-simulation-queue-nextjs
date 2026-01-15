/**
 * TimeBookingPresenterClientFactory
 * Factory for creating TimeBookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

'use client';

import { ApiBookingRepository } from '@/src/infrastructure/repositories/api/ApiBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { TimeBookingPresenter } from './TimeBookingPresenter';

export class TimeBookingPresenterClientFactory {
  static create(): TimeBookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    // ✅ Using new IBookingRepository (TIMESTAMPTZ-based)
    const bookingRepository = new ApiBookingRepository();
    const machineRepository = new ApiMachineRepository();

    return new TimeBookingPresenter(bookingRepository, machineRepository);
  }
}

export function createClientTimeBookingPresenter(): TimeBookingPresenter {
  return TimeBookingPresenterClientFactory.create();
}
