/**
 * ControlPresenterClientFactory
 * Factory for creating ControlPresenter instances on the client side
 * ✅ Injects the appropriate repositories (API-based for client)
 */

'use client';

import {
    createBookingRepository,
    createMachineRepository,
    createSessionRepository,
    createWalkInQueueRepository,
} from '@/src/infrastructure/repositories/RepositoryFactory';
import { ControlPresenter } from './ControlPresenter';

export class ControlPresenterClientFactory {
  static create(): ControlPresenter {
    // ✅ Use API-based repositories for client-side
    const machineRepo = createMachineRepository();
    const sessionRepo = createSessionRepository();
    const bookingRepo = createBookingRepository();
    const walkInRepo = createWalkInQueueRepository();

    return new ControlPresenter(
      machineRepo,
      sessionRepo,
      bookingRepo,
      walkInRepo
    );
  }
}

export function createClientControlPresenter(): ControlPresenter {
  return ControlPresenterClientFactory.create();
}
