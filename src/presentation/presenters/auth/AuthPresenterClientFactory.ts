/**
 * AuthPresenterClientFactory
 * Factory for creating AuthPresenter instances on the client side
 * ✅ Injects the Supabase Auth Repository
 */

'use client';

import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAuthRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { AuthPresenter } from './AuthPresenter';

export class AuthPresenterClientFactory {
  static create(): AuthPresenter {
    const supabase = createClient();
    const repository = new SupabaseAuthRepository(supabase);

    return new AuthPresenter(repository);
  }
}

export function createClientAuthPresenter(): AuthPresenter {
  return AuthPresenterClientFactory.create();
}
