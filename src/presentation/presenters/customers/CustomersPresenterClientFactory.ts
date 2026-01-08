'use client';

import { SupabaseCustomerRepository } from '@/src/infrastructure/repositories/supabase/SupabaseCustomerRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { CustomersPresenter } from './CustomersPresenter';

export class CustomersPresenterClientFactory {
  static create(): CustomersPresenter {
    const supabase = createClient();
    const customerRepository = new SupabaseCustomerRepository(supabase);
    
    return new CustomersPresenter(customerRepository);
  }
}

export function createClientCustomersPresenter(): CustomersPresenter {
  return CustomersPresenterClientFactory.create();
}
