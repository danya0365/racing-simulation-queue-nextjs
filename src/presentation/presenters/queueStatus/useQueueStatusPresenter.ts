'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useState } from 'react';
import { QueueStatusViewModel } from './QueueStatusPresenter';
import { createClientQueueStatusPresenter } from './QueueStatusPresenterClientFactory';

const presenter = createClientQueueStatusPresenter();

export interface QueueStatusPresenterState {
  viewModel: QueueStatusViewModel | null;
  loading: boolean;
  error: string | null;
  focusQueueId: string | null;
  isTransitioning: boolean;
  currentTime: Date;
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
 * Provides state management and actions for Queue Status operations
 * ✅ Following Clean Architecture pattern
 */
export function useQueueStatusPresenter(): [QueueStatusPresenterState, QueueStatusPresenterActions] {
  const [viewModel, setViewModel] = useState<QueueStatusViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusQueueId, setFocusQueueId] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { activeBookings, removeBooking, updateBooking, isInitialized } = useCustomerStore();
  
  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    // Don't load if not initialized yet
    if (!useCustomerStore.getState().isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      // Get queue IDs from local storage directly to ensure fresh state
      const currentActiveBookings = useCustomerStore.getState().activeBookings;
      const queueIds = currentActiveBookings.map(b => b.id);
      
      // Load queue status data
      const queues = await presenter.loadQueueStatusData(queueIds);
      // Update local store with latest status
      queues.forEach(queue => {
        const local = currentActiveBookings.find(b => b.id === queue.id);
        // Only update if something actually changed
        if (!local || local.status !== queue.status || local.position !== queue.position) {
          updateBooking(queue.id, {
            status: queue.status,
            position: queue.position,
          });
        }
      });

      // Also include queues that couldn't be fetched from server
      const fetchedIds = new Set(queues.map(q => q.id));
      const localOnlyQueues = currentActiveBookings
        .filter(b => !fetchedIds.has(b.id))
        .map(b => ({
          ...b,
          queueAhead: Math.max(0, b.position - 1),
          estimatedWaitMinutes: Math.max(0, b.position - 1) * 30, // Fallback: 30 min per queue
        }));

      // Need to import QueueStatusData interface or use any here if strict
      const allQueues = [...queues, ...localOnlyQueues];
      
      // Get view model
      const vm = presenter.getViewModel(allQueues);
      setViewModel(vm);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cancel a queue
   */
  const cancelQueue = useCallback(async (queueId: string) => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setLoading(true);
    setError(null);

    try {
      // Get customer ID from local store for ownership verification
      const currentActiveBookings = useCustomerStore.getState().activeBookings;
      const booking = currentActiveBookings.find(b => b.id === queueId);
      const customerId = booking?.customerId;
      
      await presenter.cancelQueue(queueId, customerId);
      removeBooking(queueId);
      setFocusQueueId(null);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadData, removeBooking]);

  /**
   * Enter focus mode
   */
  const enterFocusMode = useCallback((queueId: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFocusQueueId(queueId);
    // Reset transitioning after a short delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  /**
   * Exit focus mode
   */
  const exitFocusMode = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFocusQueueId(null);
    // Reset transitioning after a short delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);



  // Auto refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

    // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reload data when store is initialized or hydrated
  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  
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
