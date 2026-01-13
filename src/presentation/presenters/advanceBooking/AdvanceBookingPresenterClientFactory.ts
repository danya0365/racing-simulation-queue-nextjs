/**
 * AdvanceBookingPresenterClientFactory
 * Factory for creating AdvanceBookingPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiAdvanceBookingRepository } from '@/src/infrastructure/repositories/api/ApiAdvanceBookingRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { AdvanceBookingPresenter } from './AdvanceBookingPresenter';

export class AdvanceBookingPresenterClientFactory {
  static create(): AdvanceBookingPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const advanceBookingRepo = new ApiAdvanceBookingRepository();
    const machineRepo = new ApiMachineRepository();

    return new AdvanceBookingPresenter(advanceBookingRepo, machineRepo);
  }
}

export function createClientAdvanceBookingPresenter(): AdvanceBookingPresenter {
  return AdvanceBookingPresenterClientFactory.create();
}
