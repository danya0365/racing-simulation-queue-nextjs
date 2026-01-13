/**
 * CustomersPresenterClientFactory
 * Factory for creating CustomersPresenter instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 */

'use client';

import { ApiCustomerRepository } from '@/src/infrastructure/repositories/api/ApiCustomerRepository';
import { CustomersPresenter } from './CustomersPresenter';

export class CustomersPresenterClientFactory {
  static create(): CustomersPresenter {
    // ✅ Using API repositories - no direct Supabase connection
    const customerRepository = new ApiCustomerRepository();
    
    return new CustomersPresenter(customerRepository);
  }
}

export function createClientCustomersPresenter(): CustomersPresenter {
  return CustomersPresenterClientFactory.create();
}
