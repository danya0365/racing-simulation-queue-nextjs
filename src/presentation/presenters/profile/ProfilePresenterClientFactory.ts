/**
 * ProfilePresenterClientFactory
 * Factory for creating ProfilePresenter instances on the client side
 * ✅ Injects the appropriate repository
 */

'use client';

import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/supabase/SupabaseAuthRepository';
import { createClient } from '@/src/infrastructure/supabase/client';
import { ProfilePresenter } from './ProfilePresenter';

export class ProfilePresenterClientFactory {
  static create(): ProfilePresenter {
    // ✅ Using createClient() for proper singleton access
    const supabase = createClient();
    const repository = new SupabaseAuthRepository(supabase);
    return new ProfilePresenter(repository);
  }
}

export function createClientProfilePresenter(): ProfilePresenter {
  return ProfilePresenterClientFactory.create();
}
