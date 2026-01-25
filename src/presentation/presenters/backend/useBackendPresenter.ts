'use client';

import type { Machine, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { WalkInQueue, WalkInStatus } from '@/src/application/repositories/IWalkInQueueRepository';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackendPresenter, BackendViewModel } from './BackendPresenter';
import { createClientBackendPresenter } from './BackendPresenterClientFactory';

// Type aliases for backward compatibility - includes legacy statuses
type Queue = WalkInQueue;
type QueueStatus = WalkInStatus | 'playing' | 'completed' | 'cancelled';

export interface MachineUpdateData {
  name?: string;
  description?: string;
  position?: number;
  imageUrl?: string;
  isActive?: boolean;
  status?: MachineStatus;
  type?: string;
  hourlyRate?: number;
}

export interface BackendPresenterState {
  viewModel: BackendViewModel | null;
  loading: boolean;
  error: string | null;
  selectedQueue: Queue | null;
  selectedMachine: Machine | null;
  activeTab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'advanceBookings' | 'sessions';
  isUpdating: boolean;
}

export interface BackendPresenterActions {
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'advanceBookings' | 'sessions') => void;
  selectQueue: (queue: Queue | null) => void;
  selectMachine: (machine: Machine | null) => void;
  updateQueueStatus: (queueId: string, status: QueueStatus) => Promise<void>;

  endSession: (sessionId: string, totalAmount?: number) => Promise<void>;
  updateMachineStatus: (machineId: string, status: MachineStatus) => Promise<void>;
  updateMachine: (machineId: string, data: MachineUpdateData) => Promise<void>;
  deleteQueue: (queueId: string) => Promise<void>;
  resetMachineQueue: (machineId: string) => Promise<void>;
  updateSessionPayment: (sessionId: string, status: 'paid' | 'unpaid' | 'partial') => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for Backend presenter
 * 
 * ✅ Updated to use IWalkInQueueRepository and ISessionRepository
 */
export function useBackendPresenter(
  initialViewModel?: BackendViewModel,
  presenterOverride?: BackendPresenter
): [BackendPresenterState, BackendPresenterActions] {
  const presenter = useMemo(
    () => presenterOverride ?? createClientBackendPresenter(),
    [presenterOverride]
  );
  
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [viewModel, setViewModel] = useState<BackendViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queues' | 'machines' | 'customers' | 'advanceBookings' | 'sessions'>('dashboard');
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Load data from presenter with cancellation support
   */
  const loadData = useCallback(async (tab: string = activeTab) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      let partialData: Partial<BackendViewModel> = {};
      
      const nowStr = dayjs().format(); // Use local format
      
      if (tab === 'dashboard') {
        // Dashboard needs Everything (Machines, Queues, Sessions, Bookings Stats)
        partialData = await presenter.getViewModel(nowStr);
      } else if (tab === 'control' || tab === 'machines' || tab === 'queues') {
        // Operational tabs need real-time data but not full daily bookings
        partialData = await presenter.getControlData();
      } else if (tab === 'sessions') {
        partialData = await presenter.getSessionsData();
      } else if (tab === 'customers' || tab === 'advanceBookings') {
        // These tabs handle their own data fetching
        setLoading(false);
        return;
      } else {
        // Fallback
        partialData = await presenter.getViewModel(nowStr);
      }

      if (isMountedRef.current) {
        setViewModel(prev => {
          if (!prev) return partialData as BackendViewModel;
          return { ...prev, ...partialData };
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading backend data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeTab, presenter]);

  /**
   * Refresh data (only if tab is visible)
   */
  const refreshData = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    await loadData(activeTab);
  }, [loadData, activeTab]);

  /**
   * Set active tab and load its data
   */
  const handleSetActiveTab = useCallback((tab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'advanceBookings' | 'sessions') => {
    setActiveTab(tab);
    if (tab === 'customers' || tab === 'advanceBookings') {
      // Customers and advanceBookings tabs handle their own fetching
    } else {
      loadData(tab); 
    }
  }, [loadData]); 

  /**
   * Update queue status (call customer or cancel)
   * Note: With new schema, use callQueueCustomer or cancelQueue in BackendPresenter
   */
  const updateQueueStatus = useCallback(async (queueId: string, _status: QueueStatus) => {
    setIsUpdating(true);
    setError(null);

    try {
      if (_status === 'called') {
        await presenter.callQueueCustomer(queueId);
      } else if (_status === 'cancelled') {
        await presenter.cancelQueue(queueId);
      }
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);



  /**
   * End a session
   */
  const endSession = useCallback(async (sessionId: string, totalAmount?: number) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.endSession(sessionId, totalAmount);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);

  /**
   * Update machine status
   */
  const updateMachineStatus = useCallback(async (machineId: string, status: MachineStatus) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.updateMachineStatus(machineId, status);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);

  /**
   * Update machine details
   */
  const updateMachine = useCallback(async (machineId: string, data: MachineUpdateData) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.updateMachine(machineId, data);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);

  /**
   * Update session payment status
   */
  const updateSessionPayment = useCallback(async (sessionId: string, status: 'paid' | 'unpaid' | 'partial') => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.updateSessionPayment(sessionId, status);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);

  /**
   * Delete/Cancel queue
   */
  const deleteQueue = useCallback(async (queueId: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.cancelQueue(queueId);
      setSelectedQueue(null);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData, presenter]);

  /**
   * Select queue
   */
  const selectQueue = useCallback((queue: Queue | null) => {
    setSelectedQueue(queue);
  }, []);

  /**
   * Select machine
   */
  const selectMachine = useCallback((machine: Machine | null) => {
    setSelectedMachine(machine);
  }, []);

  /**
   * Reset machine queue (not implemented in new system)
   */
  const resetMachineQueue = useCallback(async (_machineId: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      // In new schema, walk-in queue is not machine-specific
      // This operation doesn't make sense anymore
      console.warn('resetMachineQueue is deprecated in new walk-in queue system');
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [refreshData]);

  // Load data on mount
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // Visibility-aware auto-refresh every 15 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshData();
        }
      }, 5000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
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
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return [
    {
      viewModel,
      loading,
      error,
      selectedQueue,
      selectedMachine,
      activeTab,
      isUpdating,
    },
    {
      loadData,
      refreshData,
      setActiveTab: handleSetActiveTab,
      selectQueue,
      selectMachine,
      updateQueueStatus,

      endSession,
      updateMachineStatus,
      updateMachine,
      deleteQueue,
      resetMachineQueue,
      updateSessionPayment,
      setError,
    },
  ];
}
