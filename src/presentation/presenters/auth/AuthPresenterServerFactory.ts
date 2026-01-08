/**
 * AuthPresenterServerFactory
 * Factory for creating AuthPresenter instances on the server side
 * ✅ Injects the Supabase Auth Repository
 */

import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAuthRepository';
import { createClient } from '@/src/infrastructure/supabase/server';
import { AuthPresenter } from './AuthPresenter';

export class AuthPresenterServerFactory {
  static async create(): Promise<AuthPresenter> {
    const supabase = await createClient();
    const repository = new SupabaseAuthRepository(supabase);

    return new AuthPresenter(repository);
  }
}

export async function createServerAuthPresenter(): Promise<AuthPresenter> {
  return AuthPresenterServerFactory.create();
}
