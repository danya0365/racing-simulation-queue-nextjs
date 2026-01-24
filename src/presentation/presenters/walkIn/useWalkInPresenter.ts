/**
 * useWalkInPresenter hook
 */

'use client';

import { Machine } from '@/src/application/repositories/IMachineRepository';
import { JoinWalkInQueueData, WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WalkInPresenter } from './WalkInPresenter';
import { createClientWalkInPresenter } from './WalkInPresenterClientFactory';

export interface WalkInPresenterState {
  currentQueue: WalkInQueue | null;
  availableMachines: Machine[];
  loading: boolean;
  error: string | null;
}

export interface WalkInPresenterActions {
  loadData: () => Promise<void>;
  joinQueue: (data: JoinWalkInQueueData) => Promise<WalkInQueue>;
  cancelQueue: (queueId: string) => Promise<void>;
  clearError: () => void;
}

export function useWalkInPresenter(
  presenterOverride?: WalkInPresenter
): [WalkInPresenterState, WalkInPresenterActions] {
  const presenter = useMemo(
    () => presenterOverride ?? createClientWalkInPresenter(),
    [presenterOverride]
  );
  
  const isMountedRef = useRef(true);
  const [currentQueue, setCurrentQueue] = useState<WalkInQueue | null>(null);
  const [availableMachines, setAvailableMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { activeWalkIn, joinWalkIn, leaveWalkIn, updateWalkIn, isInitialized } = useCustomerStore();

  const loadData = useCallback(async () => {
    if (!useCustomerStore.getState().isInitialized) return;
    
    setLoading(true);
    setError(null);

    try {
      const currentActive = useCustomerStore.getState().activeWalkIn;
      const customerId = currentActive?.customerId;

      const [machines, status] = await Promise.all([
        presenter.getActiveMachines(),
        customerId ? presenter.getMyQueueStatus(customerId) : Promise.resolve(null)
      ]);

      if (isMountedRef.current) {
        setAvailableMachines(machines);
        setCurrentQueue(status);
        
        // Sync with local store
        if (status) {
           // Update if changed or just joined
           if (!currentActive || currentActive.status !== status.status || currentActive.queueNumber !== status.queueNumber) {
              updateWalkIn({
                  id: status.id,
                  customerId: status.customerId,
                  queueNumber: status.queueNumber,
                  status: status.status,
                  customerName: status.customerName,
                  customerPhone: status.customerPhone,
                  partySize: status.partySize,
                  preferredStationType: status.preferredStationType,
                  preferredMachineName: status.preferredMachineName,
                  notes: status.notes,
                  joinedAt: status.joinedAt,
                  createdAt: status.createdAt
              });
           }
        } else if (currentActive) {
            // Queue disappeared from server? (e.g. Completed/Cancelled by admin but not synced yet)
            // Ideally we check if it was explicitly completed, but for now if API returns null, we respect that.
            // However, getMyQueueStatus returning null means NO active queue.
            leaveWalkIn(); 
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter, updateWalkIn, leaveWalkIn]);

  const joinQueue = useCallback(async (data: JoinWalkInQueueData) => {
    setLoading(true);
    setError(null);
    try {
      const queue = await presenter.joinQueue(data);
      
      // Save to local store
      joinWalkIn({
        id: queue.id,
        customerId: queue.customerId,
        customerName: queue.customerName,
        customerPhone: queue.customerPhone,
        partySize: queue.partySize,
        status: queue.status,
        queueNumber: queue.queueNumber,
        preferredStationType: queue.preferredStationType,
        preferredMachineName: queue.preferredMachineName,
        notes: queue.notes,
        joinedAt: queue.joinedAt,
        createdAt: queue.createdAt,
      });

      if (isMountedRef.current) {
        setCurrentQueue(queue);
      }
      return queue;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเข้าคิวได้';
      if (isMountedRef.current) setError(msg);
      throw err;
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [presenter, joinWalkIn]);

  const cancelQueue = useCallback(async (queueId: string) => {
    setLoading(true);
    try {
      const currentActive = useCustomerStore.getState().activeWalkIn;
      if (currentActive?.id === queueId) {
        // Use customerId from store if available, or just try without it (repository might need it)
        await presenter.cancelQueue(queueId, currentActive.customerId);
        leaveWalkIn();
        if (isMountedRef.current) setCurrentQueue(null);
      }
    } catch (err) {
       if (isMountedRef.current) setError('ไม่สามารถยกเลิกคิวได้');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [presenter, leaveWalkIn]);

  useEffect(() => {
    if (isInitialized) {
      loadData();
    }
  }, [isInitialized, loadData]);

  // Polling for status updates when in queue
  useEffect(() => {
    if (!currentQueue || currentQueue.status === 'cancelled' || currentQueue.status === 'seated') return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [currentQueue, loadData]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  return [
    { currentQueue, availableMachines, loading, error },
    { loadData, joinQueue, cancelQueue, clearError: () => setError(null) }
  ];
}
