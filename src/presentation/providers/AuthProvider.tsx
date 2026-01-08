/**
 * AuthProvider
 * Global authentication state provider
 * Wraps the application to provide auth state and actions
 */

'use client';

import { AuthPresenterActions, AuthPresenterState, useAuthPresenter } from '@/src/presentation/presenters/auth/useAuthPresenter';
import { createContext, ReactNode, useContext, useMemo } from 'react';

interface AuthContextValue {
  state: AuthPresenterState;
  actions: AuthPresenterActions;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Provides authentication state and actions to all child components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, actions] = useAuthPresenter();

  const value = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook
 * Custom hook to access auth state and actions
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * useAuthState hook
 * Custom hook to access only auth state
 */
export function useAuthState(): AuthPresenterState {
  const { state } = useAuth();
  return state;
}

/**
 * useAuthActions hook
 * Custom hook to access only auth actions
 */
export function useAuthActions(): AuthPresenterActions {
  const { actions } = useAuth();
  return actions;
}

/**
 * useIsAuthenticated hook
 * Custom hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { state } = useAuth();
  return state.isAuthenticated;
}

/**
 * useCurrentUser hook
 * Custom hook to get current user
 */
export function useCurrentUser() {
  const { state } = useAuth();
  return {
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
  };
}
