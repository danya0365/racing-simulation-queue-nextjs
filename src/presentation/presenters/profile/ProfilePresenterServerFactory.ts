/**
 * ProfilePresenterServerFactory
 * Factory for creating ProfilePresenter instances on the server side
 * ✅ Injects the appropriate repository
 */

import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAuthRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { ProfilePresenter } from './ProfilePresenter';

export class ProfilePresenterServerFactory {
  static async create(): Promise<ProfilePresenter> {
    const supabase = await createClient();
    const repository = new SupabaseAuthRepository(supabase);
    return new ProfilePresenter(repository);
  }
}

export async function createServerProfilePresenter(): Promise<ProfilePresenter> {
  return ProfilePresenterServerFactory.create();
}
