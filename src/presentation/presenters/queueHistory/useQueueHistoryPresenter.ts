'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useState } from 'react';
import {
    QueueHistoryItem,
    QueueHistoryPresenter,
    QueueHistoryViewModel
} from './QueueHistoryPresenter';

// Initialize presenter instance once (singleton pattern)
const presenter = new QueueHistoryPresenter();

export interface QueueHistoryPresenterState {
  viewModel: QueueHistoryViewModel;
  filter: 'all' | 'completed' | 'cancelled';
}

export interface QueueHistoryPresenterActions {
  setFilter: (filter: 'all' | 'completed' | 'cancelled') => void;
  clearHistory: () => void;
  groupByDate: (history: QueueHistoryItem[]) => Record<string, QueueHistoryItem[]>;
}

/**
 * Custom hook for QueueHistory presenter
 * Provides state management and actions for Queue History operations
 * ✅ Following Clean Architecture pattern
 */
export function useQueueHistoryPresenter(): [QueueHistoryPresenterState, QueueHistoryPresenterActions] {
  const [filter, setFilterState] = useState<'all' | 'completed' | 'cancelled'>('all');
  
  const { bookingHistory, clearHistory: storeClearHistory } = useCustomerStore();

  // Convert ActiveBooking to QueueHistoryItem
  const historyItems: QueueHistoryItem[] = bookingHistory.map(b => ({
    id: b.id,
    machineId: b.machineId,
    machineName: b.machineName,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    bookingTime: b.bookingTime,
    duration: b.duration,
    position: b.position,
    status: b.status,
    createdAt: b.createdAt,
  }));

  // Get view model
  const viewModel = presenter.getViewModel(historyItems, filter);

  /**
   * Set filter
   */
  const setFilter = useCallback((newFilter: 'all' | 'completed' | 'cancelled') => {
    setFilterState(newFilter);
  }, []);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    if (confirm('คุณต้องการลบประวัติทั้งหมดหรือไม่?')) {
      storeClearHistory();
    }
  }, [storeClearHistory]);

  /**
   * Group by date
   */
  const groupByDate = useCallback((history: QueueHistoryItem[]) => {
    return presenter.groupByDate(history);
  }, []);

  return [
    {
      viewModel,
      filter,
    },
    {
      setFilter,
      clearHistory,
      groupByDate,
    },
  ];
}
