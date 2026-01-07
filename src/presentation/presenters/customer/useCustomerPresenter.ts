'use client';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import type { Queue } from '@/src/application/repositories/IQueueRepository';
import { ActiveBooking, useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useState } from 'react';
import { BookingFormData, CustomerViewModel } from './CustomerPresenter';
import { createClientCustomerPresenter } from './CustomerPresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientCustomerPresenter();

export interface SearchResult {
  queues: Queue[];
  loading: boolean;
  error: string | null;
}

export interface CustomerPresenterState {
  viewModel: CustomerViewModel | null;
  loading: boolean;
  error: string | null;
  selectedMachine: Machine | null;
  isBookingModalOpen: boolean;
  bookingSuccess: Queue | null;
  isSubmitting: boolean;
  activeBookings: ActiveBooking[];
  bookingHistory: ActiveBooking[];
  isCancelling: boolean;
  // Search state
  searchResults: Queue[];
  isSearching: boolean;
  searchError: string | null;
  isSearchModalOpen: boolean;
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
  cancelBooking: (queueId: string) => Promise<void>;
  syncBookingStatus: () => Promise<void>;
  // Search actions
  searchByPhone: (phone: string) => Promise<void>;
  searchById: (id: string) => Promise<void>;
  clearSearchResults: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  clearHistory: () => void;
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
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Search state
  const [searchResults, setSearchResults] = useState<Queue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Get active bookings from the store  
  const { 
    activeBookings, 
    bookingHistory,
    addBooking, 
    updateBooking, 
    removeBooking,
    setCustomerInfo,
    addToHistory,
    clearHistory: clearStoreHistory,
  } = useCustomerStore();
  
  // Filter to only show active ones
  const activeBookingsList = activeBookings.filter(
    b => b.status === 'waiting' || b.status === 'playing'
  );

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
   * Sync booking status with server
   * Updates local bookings with current status from server
   */
  const syncBookingStatus = useCallback(async () => {
    try {
      for (const booking of activeBookingsList) {
        const serverQueue = await presenter.getQueueById(booking.id);
        if (serverQueue) {
          updateBooking(booking.id, {
            status: serverQueue.status as ActiveBooking['status'],
            position: serverQueue.position,
          });
        } else {
          // Queue not found on server, likely deleted or expired
          removeBooking(booking.id);
        }
      }
    } catch (err) {
      console.error('Error syncing booking status:', err);
    }
  }, [activeBookingsList, updateBooking, removeBooking]);

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
      
      // Save customer info for next time
      setCustomerInfo({
        name: data.customerName,
        phone: data.customerPhone,
      });
      
      // Get machine name for display
      const machine = viewModel?.machines.find(m => m.id === data.machineId);
      
      // Add to local store so customer can track it
      addBooking({
        id: newQueue.id,
        machineId: newQueue.machineId,
        machineName: machine?.name || `Machine ${data.machineId}`,
        customerName: newQueue.customerName,
        customerPhone: newQueue.customerPhone,
        bookingTime: newQueue.bookingTime,
        duration: newQueue.duration,
        position: newQueue.position,
        status: newQueue.status as ActiveBooking['status'],
        createdAt: new Date().toISOString(),
      });
      
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
  }, [refreshData, setCustomerInfo, addBooking, viewModel?.machines]);

  /**
   * Cancel booking
   */
  const cancelBooking = useCallback(async (queueId: string) => {
    setIsCancelling(true);
    setError(null);

    try {
      // Call presenter to cancel
      await presenter.cancelQueue(queueId);
      
      // Remove from local store (will move to history automatically)
      removeBooking(queueId);
      
      // Refresh data
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถยกเลิกคิวได้';
      setError(errorMessage);
      console.error('Error cancelling booking:', err);
      throw err;
    } finally {
      setIsCancelling(false);
    }
  }, [refreshData, removeBooking]);

  /**
   * Clear booking success state
   */
  const clearBookingSuccess = useCallback(() => {
    setBookingSuccess(null);
  }, []);

  /**
   * Search queues by phone number
   */
  const searchByPhone = useCallback(async (phone: string) => {
    if (!phone.trim()) {
      setSearchError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const results = await presenter.searchQueuesByPhone(phone);
      if (results.length === 0) {
        setSearchError('ไม่พบคิวที่ตรงกับเบอร์โทรศัพท์นี้');
      } else {
        setSearchResults(results);
        
        // Add found queues to history for easy access later
        for (const q of results) {
          const machine = viewModel?.machines.find(m => m.id === q.machineId);
          addToHistory({
            id: q.id,
            machineId: q.machineId,
            machineName: machine?.name || `Machine ${q.machineId}`,
            customerName: q.customerName,
            customerPhone: q.customerPhone,
            bookingTime: q.bookingTime,
            duration: q.duration,
            position: q.position,
            status: q.status as ActiveBooking['status'],
            createdAt: q.createdAt || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  }, [viewModel?.machines, addToHistory]);

  /**
   * Search queue by ID or position
   */
  const searchById = useCallback(async (id: string) => {
    if (!id.trim()) {
      setSearchError('กรุณากรอกหมายเลขคิว');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const result = await presenter.searchQueueById(id);
      if (!result) {
        setSearchError('ไม่พบคิวที่ตรงกับหมายเลขนี้');
      } else {
        setSearchResults([result]);
        
        // Add to history
        const machine = viewModel?.machines.find(m => m.id === result.machineId);
        addToHistory({
          id: result.id,
          machineId: result.machineId,
          machineName: machine?.name || `Machine ${result.machineId}`,
          customerName: result.customerName,
          customerPhone: result.customerPhone,
          bookingTime: result.bookingTime,
          duration: result.duration,
          position: result.position,
          status: result.status as ActiveBooking['status'],
          createdAt: result.createdAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา');
    } finally {
      setIsSearching(false);
    }
  }, [viewModel?.machines, addToHistory]);

  /**
   * Clear search results
   */
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  /**
   * Open search modal
   */
  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setSearchResults([]);
    setSearchError(null);
  }, []);

  /**
   * Close search modal
   */
  const closeSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
    setSearchResults([]);
    setSearchError(null);
  }, []);

  /**
   * Clear booking history
   */
  const clearHistory = useCallback(() => {
    clearStoreHistory();
  }, [clearStoreHistory]);

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // Sync booking status periodically
  useEffect(() => {
    if (activeBookingsList.length > 0) {
      syncBookingStatus();
      
      // Sync every 30 seconds
      const interval = setInterval(syncBookingStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [activeBookingsList.length, syncBookingStatus]);

  return [
    {
      viewModel,
      loading,
      error,
      selectedMachine,
      isBookingModalOpen,
      bookingSuccess,
      isSubmitting,
      activeBookings: activeBookingsList,
      bookingHistory,
      isCancelling,
      searchResults,
      isSearching,
      searchError,
      isSearchModalOpen,
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
      cancelBooking,
      syncBookingStatus,
      searchByPhone,
      searchById,
      clearSearchResults,
      openSearchModal,
      closeSearchModal,
      clearHistory,
    },
  ];
}
