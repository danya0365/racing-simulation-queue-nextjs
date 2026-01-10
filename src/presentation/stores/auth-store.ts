import { AuthProfile, AuthSession, AuthUser } from '@/src/application/repositories/IAuthRepository';
import { create } from 'zustand';

interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setSession: (session: AuthSession | null) => void;
  setProfile: (profile: AuthProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
  isLoading: true, // Initial loading state

  setSession: (session) => set((state) => ({ 
    session,
    user: session?.user || null,
    profile: session?.profile || null,
    isAuthenticated: !!session,
    isLoading: false,
  })),

  setProfile: (profile) => set((state) => {
    // Update profile in session as well if it exists
    const currentSession = state.session;
    let newSession = currentSession;
    
    if (currentSession) {
      newSession = {
        ...currentSession,
        profile: profile
      };
    }

    return { 
      profile,
      session: newSession
    };
  }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set({
    user: null,
    profile: null,
    session: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));
