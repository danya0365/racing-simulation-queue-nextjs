'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SingleQueuePresenter, SingleQueueViewModel } from './SingleQueuePresenter';
import { createClientSingleQueuePresenter } from './SingleQueuePresenterClientFactory';

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
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Visibility-aware polling
 * - Proper cleanup on unmount
 */
export function useSingleQueuePresenter(
  queueId: string,
  presenterOverride?: SingleQueuePresenter
): [SingleQueuePresenterState, SingleQueuePresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientSingleQueuePresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const [viewModel, setViewModel] = useState<SingleQueueViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { activeBookings, removeBooking, updateBooking } = useCustomerStore();
  const localBooking = activeBookings.find(b => b.id === queueId);
  
  const localBookingRef = useRef(localBooking);
  useEffect(() => {
    localBookingRef.current = localBooking;
  }, [localBooking]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vm = await presenter.getViewModel(queueId);
      const currentLocal = localBookingRef.current;
      
      if (vm.queue) {
        if (!currentLocal || 
            currentLocal.status !== vm.queue.status || 
            currentLocal.position !== vm.queue.position) {
          updateBooking(queueId, {
            status: vm.queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
            position: vm.queue.position,
          });
        }
        if (isMountedRef.current) {
          setViewModel(vm);
        }
      } else if (currentLocal) {
        const queueAhead = Math.max(0, currentLocal.position - 1);
        if (isMountedRef.current) {
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
        }
      } else {
        if (isMountedRef.current) {
          setError('ไม่พบข้อมูลคิว');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading queue data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [queueId, updateBooking, presenter]);

  const cancelQueue = useCallback(async () => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setIsCancelling(true);
    setError(null);

    try {
      const customerId = localBookingRef.current?.customerId;
      await presenter.cancelQueue(queueId, customerId);
      removeBooking(queueId);
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error cancelling queue:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsCancelling(false);
      }
    }
  }, [queueId, removeBooking, presenter]);

  const enterFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Visibility-aware auto refresh every 5 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadData();
        }
      }, 5000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
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
  }, [loadData]);

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
