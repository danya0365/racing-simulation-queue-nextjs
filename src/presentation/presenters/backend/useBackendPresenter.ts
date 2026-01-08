'use client';

import type { Machine, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { Queue, QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { useCallback, useEffect, useState } from 'react';
import { BackendViewModel } from './BackendPresenter';
import { createClientBackendPresenter } from './BackendPresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientBackendPresenter();

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
  activeTab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'control';
  isUpdating: boolean;
}

export interface BackendPresenterActions {
  loadData: () => Promise<void>;
  refreshData: () => Promise<void>;
  setActiveTab: (tab: 'dashboard' | 'queues' | 'machines' | 'customers' | 'control') => void;
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
 */
export function useBackendPresenter(
  initialViewModel?: BackendViewModel
): [BackendPresenterState, BackendPresenterActions] {
  const [viewModel, setViewModel] = useState<BackendViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queues' | 'machines' | 'customers' | 'control'>('dashboard');
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel();
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading backend data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async () => {
    try {
      const newViewModel = await presenter.getViewModel();
      setViewModel(newViewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    }
  }, []);

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
      setIsUpdating(false);
    }
  }, [refreshData]);

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
      setIsUpdating(false);
    }
  }, [refreshData]);

  /**
   * Update machine details (name, description, isActive, etc.)
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
      setIsUpdating(false);
    }
  }, [refreshData]);

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
      setIsUpdating(false);
    }
  }, [refreshData]);

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
      setIsUpdating(false);
    }
  }, [refreshData]);

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshData]);

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
      setActiveTab,
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
