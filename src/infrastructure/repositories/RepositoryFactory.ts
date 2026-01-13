/**
 * RepositoryFactory
 * Factory for creating repository instances on the client side
 * ✅ Centralized repository creation with proper Supabase client singleton
 */

'use client';

import { IAdvanceBookingRepository } from '@/src/application/repositories/IAdvanceBookingRepository';
import { IMachineRepository } from '@/src/application/repositories/IMachineRepository';
import { SupabaseAdvanceBookingRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAdvanceBookingRepository';
import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { createClient } from '@/src/infrastructure/supabase/client';

/**
 * Creates advance booking and machine repositories
 * Uses the singleton Supabase client
 */
export function createAdvanceBookingRepositories(): {
  advanceBookingRepo: IAdvanceBookingRepository;
  machineRepo: IMachineRepository;
} {
  const supabase = createClient();
  return {
    advanceBookingRepo: new SupabaseAdvanceBookingRepository(supabase),
    machineRepo: new SupabaseMachineRepository(supabase),
  };
}

/**
 * Creates machine repository only
 */
export function createMachineRepository(): IMachineRepository {
  const supabase = createClient();
  return new SupabaseMachineRepository(supabase);
}

/**
 * Creates advance booking repository only
 */
export function createAdvanceBookingRepository(): IAdvanceBookingRepository {
  const supabase = createClient();
  return new SupabaseAdvanceBookingRepository(supabase);
}
