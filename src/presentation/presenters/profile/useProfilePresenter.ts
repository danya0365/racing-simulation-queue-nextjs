'use client';

import type { UpdateProfileData } from '@/src/application/repositories/IAuthRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProfilePresenter, ProfileViewModel } from './ProfilePresenter';
import { createClientProfilePresenter } from './ProfilePresenterClientFactory';

export interface ProfilePresenterState {
  viewModel: ProfileViewModel | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  isEditing: boolean;
  isSubmitting: boolean;
}

export interface ProfilePresenterActions {
  loadData: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  signOut: () => Promise<void>;
  startEditing: () => void;
  cancelEditing: () => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

/**
 * Custom hook for Profile presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Proper cleanup on unmount
 */
export function useProfilePresenter(
  initialViewModel?: ProfileViewModel,
  presenterOverride?: ProfilePresenter
): [ProfilePresenterState, ProfilePresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientProfilePresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const [viewModel, setViewModel] = useState<ProfileViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel();
      if (isMountedRef.current) {
        setViewModel(newViewModel);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading profile data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updatedProfile = await presenter.updateProfile(data);
      
      if (isMountedRef.current) {
        setViewModel(prev => prev ? {
          ...prev,
          profile: updatedProfile,
        } : null);
        
        setIsEditing(false);
        setSuccessMessage('อัปเดตโปรไฟล์สำเร็จ');
      }
      return true;
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error updating profile:', err);
      }
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [presenter]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await presenter.signOut();
      if (isMountedRef.current) {
        setViewModel({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error signing out:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [presenter]);

  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  }, []);

  /**
   * Cancel editing mode
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setError(null);
  }, []);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [
    {
      viewModel,
      loading,
      error,
      successMessage,
      isEditing,
      isSubmitting,
    },
    {
      loadData,
      updateProfile,
      signOut,
      startEditing,
      cancelEditing,
      setError,
      clearMessages,
    },
  ];
}
