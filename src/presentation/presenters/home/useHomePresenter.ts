'use client';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import { useCallback, useEffect, useState } from 'react';
import { HomeViewModel } from './HomePresenter';
import { createClientHomePresenter } from './HomePresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientHomePresenter();

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
 * Provides state management and actions for Home page
 */
export function useHomePresenter(
  initialViewModel?: HomeViewModel
): [HomePresenterState, HomePresenterActions] {
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
      const newViewModel = await presenter.getViewModel();
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    try {
      const newViewModel = await presenter.getViewModel();
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

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

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

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
