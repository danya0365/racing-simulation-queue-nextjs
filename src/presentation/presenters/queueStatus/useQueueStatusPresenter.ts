'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useState } from 'react';
import { QueueStatusData, QueueStatusViewModel } from './QueueStatusPresenter';
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

  const { activeBookings, removeBooking, updateBooking } = useCustomerStore();

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get queue IDs from local storage
      const queueIds = activeBookings.map(b => b.id);
      
      // Load queue status data
      const queues = await presenter.loadQueueStatusData(queueIds);
      // Update local store with latest status
      queues.forEach(queue => {
        const local = activeBookings.find(b => b.id === queue.id);
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
      const localOnlyQueues: QueueStatusData[] = activeBookings
        .filter(b => !fetchedIds.has(b.id))
        .map(b => ({
          ...b,
          queueAhead: Math.max(0, b.position - 1),
          estimatedWaitMinutes: Math.max(0, b.position - 1) * 30, // Fallback: 30 min per queue
        }));

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
  }, []); // Removed activeBookings from dependencies

  /**
   * Cancel a queue
   */
  const cancelQueue = useCallback(async (queueId: string) => {
    if (!confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) return;

    setLoading(true);
    setError(null);

    try {
      // Get customer ID from local store for ownership verification
      const booking = activeBookings.find(b => b.id === queueId);
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

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Auto refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 5000);
    return () => clearInterval(interval);
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
