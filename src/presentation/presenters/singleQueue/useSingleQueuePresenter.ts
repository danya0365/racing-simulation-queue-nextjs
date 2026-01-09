'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SingleQueueViewModel } from './SingleQueuePresenter';
import { createClientSingleQueuePresenter } from './SingleQueuePresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientSingleQueuePresenter();

export interface SingleQueuePresenterState {
  viewModel: SingleQueueViewModel | null;
  loading: boolean;
  error: string | null;
  isCancelling: boolean;
  isFocusMode: boolean;
}

export interface SingleQueuePresenterActions {
  loadData: () => Promise<void>;
  cancelQueue: () => Promise<void>;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for SingleQueue presenter
 * Provides state management and actions for Single Queue Status operations
 * ✅ Following Clean Architecture pattern
 */
export function useSingleQueuePresenter(queueId: string): [SingleQueuePresenterState, SingleQueuePresenterActions] {
  const [viewModel, setViewModel] = useState<SingleQueueViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { activeBookings, removeBooking, updateBooking } = useCustomerStore();
  const localBooking = activeBookings.find(b => b.id === queueId);
  
  // Use ref to keep track of local booking without triggering loadData recreation
  const localBookingRef = useRef(localBooking);
  useEffect(() => {
    localBookingRef.current = localBooking;
  }, [localBooking]);

  /**
   * Load queue data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vm = await presenter.getViewModel(queueId);
      const currentLocal = localBookingRef.current;
      
      if (vm.queue) {
        // Only update local store if data actually changed to prevent loops
        if (!currentLocal || 
            currentLocal.status !== vm.queue.status || 
            currentLocal.position !== vm.queue.position) {
          updateBooking(queueId, {
            status: vm.queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
            position: vm.queue.position,
          });
        }
        setViewModel(vm);
      } else if (currentLocal) {
        // Use local storage data if server doesn't have it
        const queueAhead = Math.max(0, currentLocal.position - 1);
        setViewModel({
          queue: {
            id: currentLocal.id,
            machineId: currentLocal.machineId,
            customerName: currentLocal.customerName,
            customerPhone: currentLocal.customerPhone,
            bookingTime: currentLocal.bookingTime,
            duration: currentLocal.duration,
            status: currentLocal.status,
            position: currentLocal.position,
            createdAt: currentLocal.createdAt,
            updatedAt: currentLocal.createdAt,
          },
          machine: { 
            id: currentLocal.machineId, 
            name: currentLocal.machineName,
            description: '',
            position: 0,
            status: 'available' as const,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          },
          queueAhead,
          estimatedWaitMinutes: queueAhead * currentLocal.duration,
        });
      } else {
        setError('ไม่พบข้อมูลคิว');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading queue data:', err);
    } finally {
      setLoading(false);
    }
  }, [queueId, updateBooking]); // Removed localBooking from dependencies

  /**
   * Cancel queue
   */
  const cancelQueue = useCallback(async () => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setIsCancelling(true);
    setError(null);

    try {
      const customerId = localBookingRef.current?.customerId;
      await presenter.cancelQueue(queueId, customerId);
      removeBooking(queueId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error cancelling queue:', err);
    } finally {
      setIsCancelling(false);
    }
  }, [queueId, removeBooking]);

  /**
   * Enter focus mode
   */
  const enterFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  /**
   * Exit focus mode
   */
  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  return [
    {
      viewModel,
      loading,
      error,
      isCancelling,
      isFocusMode,
    },
    {
      loadData,
      cancelQueue,
      enterFocusMode,
      exitFocusMode,
      setError,
    },
  ];
}
