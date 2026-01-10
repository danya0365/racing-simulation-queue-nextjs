'use client';

import { useEffect } from 'react';
import { createClientAuthPresenter } from '../../presenters/auth/AuthPresenterClientFactory';
import { useAuthStore } from '../../stores/auth-store';

/**
 * Global Auth Initializer
 * Single Source of Truth for Auth State
 * Manages Supabase subscription and broadcasts to Zustand store
 */
export const AuthInitializer: React.FC = () => {
  const { setSession, reset } = useAuthStore();

  useEffect(() => {
    // initialize presenter instance (Singleton) via Factory
    const presenter = createClientAuthPresenter();

    // Subscribe to auth state changes using the Presenter Layer
    const unsubscribe = presenter.onAuthStateChange((session) => {
      if (session) {
        setSession(session);
      } else {
        reset();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
};

export default AuthInitializer;
