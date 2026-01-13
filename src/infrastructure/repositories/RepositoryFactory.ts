/**
 * RepositoryFactory
 * Factory for creating repository instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Centralized repository creation for client-side components
 */

'use client';

import { IAdvanceBookingRepository } from '@/src/application/repositories/IAdvanceBookingRepository';
import { ICustomerRepository } from '@/src/application/repositories/ICustomerRepository';
import { IMachineRepository } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository } from '@/src/application/repositories/IQueueRepository';
import { ApiAdvanceBookingRepository } from '@/src/infrastructure/repositories/api/ApiAdvanceBookingRepository';
import { ApiCustomerRepository } from '@/src/infrastructure/repositories/api/ApiCustomerRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiQueueRepository } from '@/src/infrastructure/repositories/api/ApiQueueRepository';

/**
 * Creates advance booking and machine repositories
 * Uses API-based implementations for client-side use
 */
export function createAdvanceBookingRepositories(): {
  advanceBookingRepo: IAdvanceBookingRepository;
  machineRepo: IMachineRepository;
} {
  return {
    advanceBookingRepo: new ApiAdvanceBookingRepository(),
    machineRepo: new ApiMachineRepository(),
  };
}

/**
 * Creates machine repository only
 */
export function createMachineRepository(): IMachineRepository {
  return new ApiMachineRepository();
}

/**
 * Creates advance booking repository only
 */
export function createAdvanceBookingRepository(): IAdvanceBookingRepository {
  return new ApiAdvanceBookingRepository();
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
  advanceBookingRepo: IAdvanceBookingRepository;
  customerRepo: ICustomerRepository;
} {
  return {
    machineRepo: new ApiMachineRepository(),
    queueRepo: new ApiQueueRepository(),
    advanceBookingRepo: new ApiAdvanceBookingRepository(),
    customerRepo: new ApiCustomerRepository(),
  };
}
