/**
 * QuickAdvanceBookingPresenterClientFactory
 * Factory for creating QuickAdvanceBookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiAdvanceBookingRepository } from '@/src/infrastructure/repositories/api/ApiAdvanceBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { QuickAdvanceBookingPresenter } from './QuickAdvanceBookingPresenter';

export class QuickAdvanceBookingPresenterClientFactory {
  static create(): QuickAdvanceBookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const advanceBookingRepository = new ApiAdvanceBookingRepository();
    const machineRepository = new ApiMachineRepository();

    return new QuickAdvanceBookingPresenter(advanceBookingRepository, machineRepository);
  }
}

export function createClientQuickAdvanceBookingPresenter(): QuickAdvanceBookingPresenter {
  return QuickAdvanceBookingPresenterClientFactory.create();
}
