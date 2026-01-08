'use client';

import { MockMachineRepository } from '@/src/infrastructure/repositories/mock/MockMachineRepository';
import { MockQueueRepository } from '@/src/infrastructure/repositories/mock/MockQueueRepository';
import { BookingWizardPresenter } from './BookingWizardPresenter';

export class BookingWizardPresenterClientFactory {
  static create(): BookingWizardPresenter {
    const machineRepository = new MockMachineRepository();
    const queueRepository = new MockQueueRepository();
    
    return new BookingWizardPresenter(machineRepository, queueRepository);
  }
}

export function createClientBookingWizardPresenter(): BookingWizardPresenter {
  return BookingWizardPresenterClientFactory.create();
}
