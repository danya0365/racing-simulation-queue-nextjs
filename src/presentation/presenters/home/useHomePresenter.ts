'use client';

import { getShopNow, getShopTodayString } from '@/src/lib/date';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HomePresenter, HomeViewModel } from './HomePresenter';
import { createClientHomePresenter } from './HomePresenterClientFactory';

export interface HomePresenterState {
  viewModel: HomeViewModel | null;
  loading: boolean;
  error: string | null;
  selectedMachine: Machine | null;
  isBookingModalOpen: boolean;
}

export interface HomePresenterActions {
  loadData: () => Promise<void>;
  selectMachine: (machine: Machine | null) => void;
  openBookingModal: (machine: Machine) => void;
  closeBookingModal: () => void;
  setError: (error: string | null) => void;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for Home presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Visibility-aware polling
 * - Proper cleanup on unmount
 */
export function useHomePresenter(
  initialViewModel?: HomeViewModel,
  presenterOverride?: HomePresenter
): [HomePresenterState, HomePresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientHomePresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const [viewModel, setViewModel] = useState<HomeViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const todayStr = getShopTodayString();
      const nowStr = getShopNow().toISOString();
      const newViewModel = await presenter.getViewModel(todayStr, nowStr);
      if (isMountedRef.current) {
        setViewModel(newViewModel);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading home data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Refresh data (visibility-aware)
   */
  const refreshData = useCallback(async () => {
    // ✅ Skip if tab not visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    
    try {
      const todayStr = getShopTodayString();
      const nowStr = getShopNow().toISOString();
      const newViewModel = await presenter.getViewModel(todayStr, nowStr);
      if (isMountedRef.current) {
        setViewModel(newViewModel);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    }
  }, [presenter]);

  /**
   * Select a machine
   */
  const selectMachine = useCallback((machine: Machine | null) => {
    setSelectedMachine(machine);
  }, []);

  /**
   * Open booking modal
   */
  const openBookingModal = useCallback((machine: Machine) => {
    setSelectedMachine(machine);
    setIsBookingModalOpen(true);
    setError(null);
  }, []);

  /**
   * Close booking modal
   */
  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedMachine(null);
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // ✅ Visibility-aware auto-refresh every 30 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshData();
        }
      }, 30000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
        startPolling();
      } else {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };
    
    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);

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
      selectedMachine,
      isBookingModalOpen,
    },
    {
      loadData,
      selectMachine,
      openBookingModal,
      closeBookingModal,
      setError,
      refreshData,
    },
  ];
}
