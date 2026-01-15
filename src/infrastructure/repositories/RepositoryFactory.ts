/**
 * RepositoryFactory
 * Factory for creating repository instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Centralized repository creation for client-side components
 * ✅ Now only uses IBookingRepository (TIMESTAMPTZ-based system)
 */

'use client';

import { IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { ICustomerRepository } from '@/src/application/repositories/ICustomerRepository';
import { IMachineRepository } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository } from '@/src/application/repositories/IQueueRepository';
import { ApiBookingRepository } from '@/src/infrastructure/repositories/api/ApiBookingRepository';
import { ApiCustomerRepository } from '@/src/infrastructure/repositories/api/ApiCustomerRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';

/**
 * Creates booking and machine repositories (TIMESTAMPTZ-based system)
 * Uses API-based implementations for client-side use
 */
export function createBookingRepositories(): {
  bookingRepo: IBookingRepository;
  machineRepo: IMachineRepository;
} {
  return {
    bookingRepo: new ApiBookingRepository(),
    machineRepo: new ApiMachineRepository(),
  };
}

/**
 * Creates booking repository only (TIMESTAMPTZ-based system)
 */
export function createBookingRepository(): IBookingRepository {
  return new ApiBookingRepository();
}

/**
 * Creates machine repository only
 */
export function createMachineRepository(): IMachineRepository {
  return new ApiMachineRepository();
}

/**
 * Creates queue repository only
 */
export function createQueueRepository(): IQueueRepository {
  return new ApiQueueRepository();
}

/**
 * Creates customer repository only
 */
export function createCustomerRepository(): ICustomerRepository {
  return new ApiCustomerRepository();
}

/**
 * Creates all common repositories
 */
export function createAllRepositories(): {
  machineRepo: IMachineRepository;
  queueRepo: IQueueRepository;
  bookingRepo: IBookingRepository;
  customerRepo: ICustomerRepository;
} {
  return {
    machineRepo: new ApiMachineRepository(),
    queueRepo: new ApiQueueRepository(),
    bookingRepo: new ApiBookingRepository(),
    customerRepo: new ApiCustomerRepository(),
  };
}
