/**
 * RepositoryFactory
 * Factory for creating repository instances on the client side
 * 
 * ✅ Uses API-based repositories to avoid Supabase connection pool issues
 * ✅ Centralized repository creation for client-side components
 * ✅ Now uses IWalkInQueueRepository and ISessionRepository (new schema)
 */

'use client';

import { IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { ICustomerRepository } from '@/src/application/repositories/ICustomerRepository';
import { IMachineRepository } from '@/src/application/repositories/IMachineRepository';
import { ISessionRepository } from '@/src/application/repositories/ISessionRepository';
import { IWalkInQueueRepository } from '@/src/application/repositories/IWalkInQueueRepository';
import { ApiBookingRepository } from '@/src/infrastructure/repositories/api/ApiBookingRepository';
import { ApiCustomerRepository } from '@/src/infrastructure/repositories/api/ApiCustomerRepository';
import { ApiMachineRepository } from '@/src/infrastructure/repositories/api/ApiMachineRepository';
import { ApiSessionRepository } from '@/src/infrastructure/repositories/api/ApiSessionRepository';
import { ApiWalkInQueueRepository } from '@/src/infrastructure/repositories/api/ApiWalkInQueueRepository';

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
 * Creates customer repository only
 */
export function createCustomerRepository(): ICustomerRepository {
  return new ApiCustomerRepository();
}

/**
 * Creates walk-in queue repository
 */
export function createWalkInQueueRepository(): IWalkInQueueRepository {
  return new ApiWalkInQueueRepository();
}

/**
 * Creates session repository
 */
export function createSessionRepository(): ISessionRepository {
  return new ApiSessionRepository();
}

/**
 * Creates all common repositories
 */
export function createAllRepositories(): {
  machineRepo: IMachineRepository;
  bookingRepo: IBookingRepository;
  customerRepo: ICustomerRepository;
  walkInRepo: IWalkInQueueRepository;
  sessionRepo: ISessionRepository;
} {
  return {
    machineRepo: new ApiMachineRepository(),
    bookingRepo: new ApiBookingRepository(),
    customerRepo: new ApiCustomerRepository(),
    walkInRepo: new ApiWalkInQueueRepository(),
    sessionRepo: new ApiSessionRepository(),
  };
}

// Re-export types for convenience
export type {
    IBookingRepository,
    ICustomerRepository,
    IMachineRepository, ISessionRepository, IWalkInQueueRepository
};

