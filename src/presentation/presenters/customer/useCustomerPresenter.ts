'use client';

import type { Machine } from '@/src/application/repositories/IMachineRepository';
import type { Queue } from '@/src/application/repositories/IQueueRepository';
import { ActiveBooking, useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookingFormData, CustomerPresenter, CustomerViewModel } from './CustomerPresenter';
import { createClientCustomerPresenter } from './CustomerPresenterClientFactory';

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
  searchByPhone: (phone: string) => Promise<void>;
  searchById: (id: string) => Promise<void>;
  clearSearchResults: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
  clearHistory: () => void;
}

/**
 * Custom hook for Customer presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Visibility-aware polling
 * - Proper cleanup on unmount
 */
export function useCustomerPresenter(
  initialViewModel?: CustomerViewModel,
  presenterOverride?: CustomerPresenter
): [CustomerPresenterState, CustomerPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientCustomerPresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

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
  
  const [searchResults, setSearchResults] = useState<Queue[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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
  
  const activeBookingsList = useMemo(() => 
    activeBookings.filter(b => b.status === 'waiting' || b.status === 'playing'),
    [activeBookings]
  );

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
        console.error('Error loading customer data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  const refreshData = useCallback(async () => {
    // ✅ Skip if tab not visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    
    try {
      const newViewModel = await presenter.getViewModel();
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

  const activeBookingsRef = useRef(activeBookingsList);
  useEffect(() => {
    activeBookingsRef.current = activeBookingsList;
  }, [activeBookingsList]);

  const syncBookingStatus = useCallback(async () => {
    // ✅ Skip if tab not visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    
    const list = activeBookingsRef.current;
    if (list.length === 0) return;

    try {
      for (const booking of list) {
        const serverQueue = await presenter.getQueueById(booking.id);
        if (serverQueue) {
          if (serverQueue.status !== booking.status || serverQueue.position !== booking.position) {
            updateBooking(booking.id, {
              status: serverQueue.status as ActiveBooking['status'],
              position: serverQueue.position,
            });
          }
        } else {
          removeBooking(booking.id);
        }
      }
    } catch (err) {
      console.error('Error syncing booking status:', err);
    }
  }, [updateBooking, removeBooking, presenter]);

  const selectMachine = useCallback((machine: Machine | null) => {
    setSelectedMachine(machine);
  }, []);

  const openBookingModal = useCallback((machine: Machine) => {
    setSelectedMachine(machine);
    setIsBookingModalOpen(true);
    setError(null);
    setBookingSuccess(null);
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setSelectedMachine(null);
    setError(null);
  }, []);

  const submitBooking = useCallback(async (data: BookingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newQueue = await presenter.createBooking(data);
      
      setCustomerInfo({
        name: data.customerName,
        phone: data.customerPhone,
        id: newQueue.customerId,
      });

      const machine = viewModel?.machines.find(m => m.id === data.machineId);
      
      addBooking({
        id: newQueue.id,
        machineId: newQueue.machineId,
        customerId: newQueue.customerId,
        machineName: machine?.name || `Machine ${data.machineId}`,
        customerName: newQueue.customerName,
        customerPhone: newQueue.customerPhone,
        bookingTime: newQueue.bookingTime,
        duration: newQueue.duration,
        position: newQueue.position,
        status: newQueue.status as ActiveBooking['status'],
        createdAt: dayjs().toISOString(),
      });
      
      if (isMountedRef.current) {
        setBookingSuccess(newQueue);
        setIsBookingModalOpen(false);
      }
      await refreshData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error submitting booking:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [refreshData, setCustomerInfo, addBooking, viewModel?.machines, presenter]);

  const cancelBooking = useCallback(async (queueId: string) => {
    setIsCancelling(true);
    setError(null);

    try {
      const booking = activeBookingsRef.current.find(b => b.id === queueId);
      const customerId = booking?.customerId;
      
      await presenter.cancelQueue(queueId, customerId);
      removeBooking(queueId);
      await refreshData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถยกเลิกคิวได้';
        setError(errorMessage);
        console.error('Error cancelling booking:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  }, [refreshData, removeBooking, presenter]);

  const clearBookingSuccess = useCallback(() => {
    setBookingSuccess(null);
  }, []);

  const searchByPhone = useCallback(async (phone: string) => {
    if (!phone.trim()) {
      setSearchError('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const { customerInfo } = useCustomerStore.getState();
      const securityTokenId = customerInfo.id;

      const results = await presenter.searchQueuesByPhone(phone, securityTokenId);
      if (isMountedRef.current) {
        if (results.length === 0) {
          setSearchError('ไม่พบคิวที่ตรงกับเบอร์โทรศัพท์นี้');
        } else {
          setSearchResults(results);
          
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
              createdAt: q.createdAt || dayjs().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setSearchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [viewModel?.machines, addToHistory, presenter]);

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
      if (isMountedRef.current) {
        if (!result) {
          setSearchError('ไม่พบคิวที่ตรงกับหมายเลขนี้');
        } else {
          setSearchResults([result]);
          
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
            createdAt: result.createdAt || dayjs().toISOString(),
          });
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setSearchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSearching(false);
      }
    }
  }, [viewModel?.machines, addToHistory, presenter]);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const openSearchModal = useCallback(() => {
    setIsSearchModalOpen(true);
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const closeSearchModal = useCallback(() => {
    setIsSearchModalOpen(false);
    setSearchResults([]);
    setSearchError(null);
  }, []);

  const clearHistory = useCallback(() => {
    clearStoreHistory();
  }, [clearStoreHistory]);

  // Load data on mount
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // ✅ Visibility-aware sync booking status
  useEffect(() => {
    if (activeBookingsList.length === 0) return;

    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      syncBookingStatus();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          syncBookingStatus();
        }
      }, 30000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncBookingStatus();
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
  }, [activeBookingsList.length, syncBookingStatus]);

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
