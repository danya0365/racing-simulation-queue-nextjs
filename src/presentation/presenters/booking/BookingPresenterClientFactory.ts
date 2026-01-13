/**
 * BookingPresenterClientFactory
 * Factory for creating BookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiAdvanceBookingRepository } from '@/src/infrastructure/repositories/api/ApiAdvanceBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { BookingPresenter } from './BookingPresenter';

export class BookingPresenterClientFactory {
  static create(): BookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const advanceBookingRepo = new ApiAdvanceBookingRepository();
    const machineRepo = new ApiMachineRepository();

    return new BookingPresenter(advanceBookingRepo, machineRepo);
  }
}

export function createClientBookingPresenter(): BookingPresenter {
  return BookingPresenterClientFactory.create();
}
