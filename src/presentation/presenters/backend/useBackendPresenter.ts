'use client';

import type { Machine, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { Queue, QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackendPresenter, BackendViewModel } from './BackendPresenter';
import { createClientBackendPresenter } from './BackendPresenterClientFactory';

export interface MachineUpdateData {
  name?: string;
  description?: string;
  position?: number;
  imageUrl?: string;
  isActive?: boolean;
  status?: MachineStatus;
}

export interface BackendPresenterState {
  viewModel: BackendViewModel | null;
  loading: boolean;
  error: string | null;
  selectedQueue: Queue | null;
  selectedMachine: Machine | null;
  activeTab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'control' | 'advanceBookings';
  isUpdating: boolean;
}

export interface BackendPresenterActions {
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'control' | 'advanceBookings') => void;
  selectQueue: (queue: Queue | null) => void;
  selectMachine: (machine: Machine | null) => void;
  updateQueueStatus: (queueId: string, status: QueueStatus) => Promise<void>;
  updateMachineStatus: (machineId: string, status: MachineStatus) => Promise<void>;
  updateMachine: (machineId: string, data: MachineUpdateData) => Promise<void>;
  deleteQueue: (queueId: string) => Promise<void>;
  resetMachineQueue: (machineId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for Backend presenter
 * 
 * ✅ Improvements made:
 * - Presenter created inside hook with useMemo (no global singleton)
 * - Visibility-aware polling (stops when tab is hidden)
 * - AbortController for request cancellation
 * - Proper cleanup on unmount
 */
export function useBackendPresenter(
  initialViewModel?: BackendViewModel,
  presenterOverride?: BackendPresenter
): [BackendPresenterState, BackendPresenterActions] {
  // ✅ Create presenter inside hook with useMemo (not global singleton)
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientBackendPresenter(),
    [presenterOverride]
  );
  
  // ✅ Track if component is mounted for cleanup
  const isMountedRef = useRef(true);
  
  // ✅ AbortController ref for canceling ongoing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const [viewModel, setViewModel] = useState<BackendViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queues' | 'machines' | 'customers' | 'control' | 'advanceBookings'>('dashboard');
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Load data from presenter with cancellation support
   */
  const loadData = useCallback(async (tab: string = activeTab) => {
    // ✅ Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // ✅ Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      let partialData: Partial<BackendViewModel> = {};
      
      if (tab === 'dashboard') {
        partialData = await presenter.getDashboardData();
      } else if (tab === 'control' || tab === 'machines' || tab === 'queues') {
        partialData = await presenter.getControlData();
      } else {
        partialData = await presenter.getViewModel();
      }

      // ✅ Only update state if still mounted
      if (isMountedRef.current) {
        setViewModel(prev => {
          if (!prev) return partialData as BackendViewModel;
          return { ...prev, ...partialData };
        });
      }
    } catch (err) {
      // ✅ Ignore abort errors
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
    // ✅ Skip refresh if tab is not visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    await loadData(activeTab);
  }, [loadData, activeTab]);

  /**
   * Set active tab and load its data
   */
  const handleSetActiveTab = useCallback((tab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'control' | 'advanceBookings') => {
    setActiveTab(tab);
    if (tab === 'customers' || tab === 'advanceBookings') {
      // Customers and advanceBookings tabs handle their own fetching
    } else {
      loadData(tab); 
    }
  }, [loadData]); 

  /**
   * Update queue status
   */
  const updateQueueStatus = useCallback(async (queueId: string, status: QueueStatus) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.updateQueueStatus(queueId, status);
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
   * Delete queue
   */
  const deleteQueue = useCallback(async (queueId: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.deleteQueue(queueId);
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
   * Reset machine queue
   */
  const resetMachineQueue = useCallback(async (machineId: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.resetMachineQueue(machineId);
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

  // ✅ Load data on mount
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // ✅ Visibility-aware auto-refresh every 15 seconds
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const startPolling = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      intervalId = setInterval(() => {
        // ✅ Only refresh if document is visible
        if (document.visibilityState === 'visible') {
          refreshData();
        }
      }, 15000);
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // ✅ Refresh immediately when tab becomes visible
        refreshData();
        startPolling();
      } else {
        // ✅ Stop polling when tab is hidden
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };
    
    // Start polling initially
    startPolling();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // ✅ Cleanup
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cancel any pending requests
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
      updateMachineStatus,
      updateMachine,
      deleteQueue,
      resetMachineQueue,
      setError,
    },
  ];
}
