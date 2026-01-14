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
      const queueIds = currentActiveBookings.map(b => b.id);
      
      const queues = await presenter.loadQueueStatusData(queueIds);
      
      queues.forEach(queue => {
        const local = currentActiveBookings.find(b => b.id === queue.id);
        if (!local || local.status !== queue.status || local.position !== queue.position) {
          updateBooking(queue.id, {
            status: queue.status,
            position: queue.position,
          });
        }
      });

      const fetchedIds = new Set(queues.map(q => q.id));
      const localOnlyQueues = currentActiveBookings
        .filter(b => !fetchedIds.has(b.id))
        .map(b => ({
          ...b,
          queueAhead: Math.max(0, b.position - 1),
          estimatedWaitMinutes: Math.max(0, b.position - 1) * 30,
        }));

      const allQueues = [...queues, ...localOnlyQueues];
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
