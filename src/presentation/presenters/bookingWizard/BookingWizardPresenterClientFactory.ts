'use client';

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseQueueRepository';
import { supabase } from '@/src/infrastructure/supabase/client';
import { BookingWizardPresenter } from './BookingWizardPresenter';

export class BookingWizardPresenterClientFactory {
  static create(): BookingWizardPresenter {
    const machineRepository = new SupabaseMachineRepository(supabase);
    const queueRepository = new SupabaseQueueRepository(supabase);
    
    return new BookingWizardPresenter(machineRepository, queueRepository);
  }
}

export function createClientBookingWizardPresenter(): BookingWizardPresenter {
  return BookingWizardPresenterClientFactory.create();
}
