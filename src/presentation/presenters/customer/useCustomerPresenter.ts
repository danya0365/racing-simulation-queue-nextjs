'use client';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import type { Queue } from '@/src/application/repositories/IQueueRepository';
import { useCallback, useEffect, useState } from 'react';
import { BookingFormData, CustomerViewModel } from './CustomerPresenter';
import { createClientCustomerPresenter } from './CustomerPresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientCustomerPresenter();

export interface CustomerPresenterState {
  viewModel: CustomerViewModel | null;
  loading: boolean;
  error: string | null;
  selectedMachine: Machine | null;
  isBookingModalOpen: boolean;
  bookingSuccess: Queue | null;
  isSubmitting: boolean;
}

export interface CustomerPresenterActions {
  loadData: () => Promise<void>;
  selectMachine: (machine: Machine | null) => void;
  openBookingModal: (machine: Machine) => void;
  closeBookingModal: () => void;
  submitBooking: (data: BookingFormData) => Promise<void>;
  clearBookingSuccess: () => void;
  setError: (error: string | null) => void;
  refreshData: () => Promise<void>;
}

/**
 * Custom hook for Customer presenter
 */
export function useCustomerPresenter(
  initialViewModel?: CustomerViewModel
): [CustomerPresenterState, CustomerPresenterActions] {
  const [viewModel, setViewModel] = useState<CustomerViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Queue | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      console.error('Error loading customer data:', err);
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
    setBookingSuccess(null);
  }, []);

  /**
   * Close booking modal
   */
  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedMachine(null);
    setError(null);
  }, []);

  /**
   * Submit booking
   */
  const submitBooking = useCallback(async (data: BookingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newQueue = await presenter.createBooking(data);
      setBookingSuccess(newQueue);
      setIsBookingModalOpen(false);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error submitting booking:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [refreshData]);

  /**
   * Clear booking success state
   */
  const clearBookingSuccess = useCallback(() => {
    setBookingSuccess(null);
  }, []);

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  return [
    {
      viewModel,
      loading,
      error,
      selectedMachine,
      isBookingModalOpen,
      bookingSuccess,
      isSubmitting,
    },
    {
      loadData,
      selectMachine,
      openBookingModal,
      closeBookingModal,
      submitBooking,
      clearBookingSuccess,
      setError,
      refreshData,
    },
  ];
}
