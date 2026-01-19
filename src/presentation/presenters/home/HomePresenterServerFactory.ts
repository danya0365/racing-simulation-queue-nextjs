/**
 * HomePresenterServerFactory
 * Factory for creating HomePresenter instances on the server side
 * 
 * ✅ Uses new IWalkInQueueRepository
 */

import { SupabaseMachineRepository } from '@/src/infrastructure/repositories/supabase/SupabaseMachineRepository';
import { SupabaseWalkInQueueRepository } from '@/src/infrastructure/repositories/supabase/SupabaseWalkInQueueRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { HomePresenter } from './HomePresenter';

export class HomePresenterServerFactory {
  static async create(): Promise<HomePresenter> {
    const supabase = await createClient();
    
    // ✅ Using Supabase Repositories for production/real data
    const machineRepository = new SupabaseMachineRepository(supabase);
    const walkInQueueRepository = new SupabaseWalkInQueueRepository(supabase);

    return new HomePresenter(machineRepository, walkInQueueRepository);
  }
}

export async function createServerHomePresenter(): Promise<HomePresenter> {
  return await HomePresenterServerFactory.create();
}
