/**
 * BookingPresenterClientFactory
 * Factory for creating BookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

'use client';

import { ApiBookingRepository } from '@/src/infrastructure/repositories/api/ApiBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { BookingPresenter } from './BookingPresenter';

export class BookingPresenterClientFactory {
  static create(): BookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    // ✅ Using new IBookingRepository (TIMESTAMPTZ-based)
    const bookingRepo = new ApiBookingRepository();
    const machineRepo = new ApiMachineRepository();

    return new BookingPresenter(bookingRepo, machineRepo);
  }
}

export function createClientBookingPresenter(): BookingPresenter {
  return BookingPresenterClientFactory.create();
}
