'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QueueStatusPresenter, QueueStatusViewModel } from './QueueStatusPresenter';
import { createClientQueueStatusPresenter } from './QueueStatusPresenterClientFactory';

export interface QueueStatusPresenterState {
  viewModel: QueueStatusViewModel | null;
  loading: boolean;
  error: string | null;
  focusQueueId: string | null;
  isTransitioning: boolean;
  currentTime: dayjs.Dayjs;
}

export interface QueueStatusPresenterActions {
  loadData: () => Promise<void>;
  cancelQueue: (queueId: string) => Promise<void>;
  enterFocusMode: (queueId: string) => void;
  exitFocusMode: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for QueueStatus presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Visibility-aware polling
 * - Proper cleanup on unmount
 */
export function useQueueStatusPresenter(
  presenterOverride?: QueueStatusPresenter
): [QueueStatusPresenterState, QueueStatusPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientQueueStatusPresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const [viewModel, setViewModel] = useState<QueueStatusViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusQueueId, setFocusQueueId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());

  const { removeBooking, updateBooking, isInitialized } = useCustomerStore();
  
  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    if (!useCustomerStore.getState().isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      const currentActiveBookings = useCustomerStore.getState().activeBookings;
      
      // Get first booking's customerId for the API call
      const customerId = currentActiveBookings[0]?.customerId;
      if (!customerId && currentActiveBookings.length === 0) {
        // No bookings, set empty view model
        if (isMountedRef.current) {
          setViewModel(presenter.getViewModel([]));
        }
        return;
      }
      
      // Use loadMyQueueStatus with customerId
      const queues = await presenter.loadMyQueueStatus(customerId || '');
      
      // Update local store with fetched data
      queues.forEach(queue => {
        const local = currentActiveBookings.find(b => b.id === queue.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const queuePosition = (queue as any).queueNumber || (queue as any).position || 0;
        if (!local || local.status !== queue.status || local.position !== queuePosition) {
          updateBooking(queue.id, {
            status: queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
            position: queuePosition,
          });
        }
      });

      const fetchedIds = new Set(queues.map(q => q.id));
      const localOnlyQueues = currentActiveBookings
        .filter(b => !fetchedIds.has(b.id))
        .map(b => ({
          ...b,
          queueNumber: b.position || 0,
          queuesAhead: Math.max(0, (b.position || 1) - 1),
          estimatedWaitMinutes: Math.max(0, (b.position || 1) - 1) * 30,
          partySize: 1,
          joinedAt: b.bookingTime || new Date().toISOString(),
          // Backward compatibility
          queueAhead: Math.max(0, (b.position || 1) - 1),
          position: b.position || 0,
          bookingTime: b.bookingTime,
          duration: b.duration || 30,
        }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allQueues = [...queues, ...localOnlyQueues] as any[];
      const vm = presenter.getViewModel(allQueues);
      
      if (isMountedRef.current) {
        setViewModel(vm);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter, updateBooking]);

  /**
   * Cancel a queue
   */
  const cancelQueue = useCallback(async (queueId: string) => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setLoading(true);
    setError(null);

    try {
      const currentActiveBookings = useCustomerStore.getState().activeBookings;
      const booking = currentActiveBookings.find(b => b.id === queueId);
      const customerId = booking?.customerId;
      
      await presenter.cancelQueue(queueId, customerId);
      removeBooking(queueId);
      setFocusQueueId(null);
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [loadData, removeBooking, presenter]);

  /**
   * Enter focus mode
   */
  const enterFocusMode = useCallback((queueId: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFocusQueueId(queueId);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsTransitioning(false);
      }
    }, 300);
  }, [isTransitioning]);

  /**
   * Exit focus mode
   */
  const exitFocusMode = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFocusQueueId(null);
    setTimeout(() => {
      if (isMountedRef.current) {
        setIsTransitioning(false);
      }
    }, 300);
  }, [isTransitioning]);

  // ✅ Visibility-aware auto refresh every 15 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadData();
        }
      }, 15000);
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

  // Update time every second (only when visible)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startTimeUpdate = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible' && isMountedRef.current) {
          setCurrentTime(dayjs());
        }
      }, 1000);
    };
    
    startTimeUpdate();
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Reload data when store is initialized
  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

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
      focusQueueId,
      isTransitioning,
      currentTime,
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
