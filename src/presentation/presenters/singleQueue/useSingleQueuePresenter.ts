'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useState } from 'react';
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

  /**
   * Load queue data
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vm = await presenter.getViewModel(queueId);
      
      if (vm.queue) {
        // Update local store with latest status
        updateBooking(queueId, {
          status: vm.queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
          position: vm.queue.position,
        });
        setViewModel(vm);
      } else if (localBooking) {
        // Use local storage data if server doesn't have it
        setViewModel({
          queue: {
            id: localBooking.id,
            machineId: localBooking.machineId,
            customerName: localBooking.customerName,
            customerPhone: localBooking.customerPhone,
            bookingTime: localBooking.bookingTime,
            duration: localBooking.duration,
            status: localBooking.status,
            position: localBooking.position,
            createdAt: localBooking.createdAt,
            updatedAt: localBooking.createdAt,
          },
          machine: { 
            id: localBooking.machineId, 
            name: localBooking.machineName,
            description: '',
            position: 0,
            status: 'available' as const,
            isActive: true,
            createdAt: '',
            updatedAt: '',
          },
          queueAhead: Math.max(0, localBooking.position - 1),
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
  }, [queueId, updateBooking, localBooking]);

  /**
   * Cancel queue
   */
  const cancelQueue = useCallback(async () => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setIsCancelling(true);
    setError(null);

    try {
      await presenter.cancelQueue(queueId);
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
