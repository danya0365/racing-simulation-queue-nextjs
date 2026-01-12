'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useMemo, useState } from 'react';
import {
  QueueHistoryItem,
  QueueHistoryPresenter,
  QueueHistoryViewModel
} from './QueueHistoryPresenter';

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
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 */
export function useQueueHistoryPresenter(
  presenterOverride?: QueueHistoryPresenter
): [QueueHistoryPresenterState, QueueHistoryPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? new QueueHistoryPresenter(),
    [presenterOverride]
  );
  
  const [filter, setFilterState] = useState<'all' | 'completed' | 'cancelled'>('all');
  
  const { bookingHistory, clearHistory: storeClearHistory, isInitialized } = useCustomerStore();

  const historyItems: QueueHistoryItem[] = isInitialized ? bookingHistory.map(b => ({
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
  })) : [];

  const viewModel = presenter.getViewModel(historyItems, filter);

  const setFilter = useCallback((newFilter: 'all' | 'completed' | 'cancelled') => {
    setFilterState(newFilter);
  }, []);

  const clearHistory = useCallback(() => {
    if (confirm('คุณต้องการลบประวัติทั้งหมดหรือไม่?')) {
      storeClearHistory();
    }
  }, [storeClearHistory]);

  const groupByDate = useCallback((history: QueueHistoryItem[]) => {
    return presenter.groupByDate(history);
  }, [presenter]);

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
