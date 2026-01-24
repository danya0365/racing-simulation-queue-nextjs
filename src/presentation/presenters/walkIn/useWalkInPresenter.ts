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

  const { activeBookings, addBooking, removeBooking, updateBooking, isInitialized } = useCustomerStore();

  const loadData = useCallback(async () => {
    if (!useCustomerStore.getState().isInitialized) return;
    
    setLoading(true);
    setError(null);

    try {
      const currentActive = useCustomerStore.getState().activeBookings;
      const customerId = currentActive[0]?.customerId;

      const [machines, status] = await Promise.all([
        presenter.getAvailableMachines(),
        customerId ? presenter.getMyQueueStatus(customerId) : Promise.resolve(null)
      ]);

      if (isMountedRef.current) {
        setAvailableMachines(machines);
        setCurrentQueue(status);
        
        // Sync with local store if status changed
        if (status) {
          const local = currentActive.find(b => b.id === status.id);
          if (!local || local.status !== status.status || local.position !== status.queueNumber) {
            updateBooking(status.id, {
              status: status.status,
              position: status.queueNumber,
            });
          }
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
  }, [presenter, updateBooking]);

  const joinQueue = useCallback(async (data: JoinWalkInQueueData) => {
    setLoading(true);
    setError(null);
    try {
      const queue = await presenter.joinQueue(data);
      
      // Save to local store
      addBooking({
        id: queue.id,
        customerId: queue.customerId,
        customerName: queue.customerName,
        customerPhone: queue.customerPhone,
        machineId: queue.preferredMachineId || '',
        machineName: queue.preferredMachineName || '',
        bookingTime: queue.joinedAt,
        duration: 30, // Default duration estimate
        status: queue.status,
        position: queue.queueNumber,
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
  }, [presenter, addBooking]);

  const cancelQueue = useCallback(async (queueId: string) => {
    setLoading(true);
    try {
      const currentActive = useCustomerStore.getState().activeBookings;
      const booking = currentActive.find(b => b.id === queueId);
      if (booking?.customerId) {
        await presenter.cancelQueue(queueId, booking.customerId);
        removeBooking(queueId);
        if (isMountedRef.current) setCurrentQueue(null);
      }
    } catch (err) {
       if (isMountedRef.current) setError('ไม่สามารถยกเลิกคิวได้');
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [presenter, removeBooking]);

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
