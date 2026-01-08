'use client';

import { MockCustomerRepository } from '@/src/infrastructure/repositories/mock/MockCustomerRepository';
import { CustomersPresenter } from './CustomersPresenter';

export class CustomersPresenterClientFactory {
  static create(): CustomersPresenter {
    const customerRepository = new MockCustomerRepository();
    return new CustomersPresenter(customerRepository);
  }
}

export function createClientCustomersPresenter(): CustomersPresenter {
  return CustomersPresenterClientFactory.create();
}
