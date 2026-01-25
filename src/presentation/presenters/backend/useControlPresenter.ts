'use client';

import { Booking } from '@/src/application/repositories/IBookingRepository';
import { Session } from '@/src/application/repositories/ISessionRepository';
import { WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ControlPresenter, ControlViewModel } from './ControlPresenter';
import { createClientControlPresenter } from './ControlPresenterClientFactory';

// ============================================================
// STATE & ACTIONS INTERFACES
// ============================================================

export interface ControlPresenterState {
  viewModel: ControlViewModel | null;
  loading: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Modal states
  manualStartModal: { isOpen: boolean; machineId: string | null };
  queueSelectModal: { isOpen: boolean; machineId: string | null };
  endSessionModal: { isOpen: boolean; sessionId: string | null };
  checkInModal: { isOpen: boolean; machineId: string | null; booking: Booking | null };
  sessionDetailModal: { isOpen: boolean; session: Session | null };
  historyModal: { isOpen: boolean; machineId: string | null; sessions: Session[] };
}

export interface ControlPresenterActions {
  loadData: () => Promise<void>;
  
  // Session actions
  startManualSession: (machineId: string, customerName: string, notes?: string, estimatedDurationMinutes?: number) => Promise<void>;
  startFromQueue: (machineId: string, queue: WalkInQueue, estimatedDurationMinutes?: number) => Promise<void>;
  startFromBooking: (machineId: string, booking: Booking) => Promise<void>;
  endSession: (sessionId: string, totalAmount?: number) => Promise<void>;
  updateSessionPayment: (sessionId: string, status: 'paid' | 'unpaid' | 'partial') => Promise<void>;
  
  // Modal actions
  openManualStartModal: (machineId: string) => void;
  closeManualStartModal: () => void;
  openQueueSelectModal: (machineId: string) => void;
  closeQueueSelectModal: () => void;
  openEndSessionModal: (sessionId: string) => void;
  closeEndSessionModal: () => void;
  openCheckInModal: (machineId: string, booking: Booking) => void;
  closeCheckInModal: () => void;
  openSessionDetailModal: (session: Session) => void;
  closeSessionDetailModal: () => void;
  openHistoryModal: (machineId: string) => Promise<void>;
  closeHistoryModal: () => void;
  
  setError: (error: string | null) => void;
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

export function useControlPresenter(
  initialViewModel?: ControlViewModel,
  presenterOverride?: ControlPresenter
): [ControlPresenterState, ControlPresenterActions] {
  // Create presenter with useMemo
  const presenter = useMemo(
    () => presenterOverride ?? createClientControlPresenter(),
    [presenterOverride]
  );

  // Track mounted state for memory leak protection
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [viewModel, setViewModel] = useState<ControlViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [manualStartModal, setManualStartModal] = useState<{ isOpen: boolean; machineId: string | null }>({
    isOpen: false,
    machineId: null,
  });
  const [queueSelectModal, setQueueSelectModal] = useState<{ isOpen: boolean; machineId: string | null }>({
    isOpen: false,
    machineId: null,
  });
  const [endSessionModal, setEndSessionModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null,
  });
  const [checkInModal, setCheckInModal] = useState<{ isOpen: boolean; machineId: string | null; booking: Booking | null }>({
    isOpen: false,
    machineId: null,
    booking: null,
  });
  const [sessionDetailModal, setSessionDetailModal] = useState<{ isOpen: boolean; session: Session | null }>({
    isOpen: false,
    session: null,
  });
  const [historyModal, setHistoryModal] = useState<{ isOpen: boolean; machineId: string | null; sessions: Session[] }>({
    isOpen: false,
    machineId: null,
    sessions: [],
  });

  // ============================================================
  // DATA LOADING
  // ============================================================

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel();
      if (isMountedRef.current) {
        setViewModel(newViewModel);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading control data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  // ============================================================
  // SESSION ACTIONS
  // ============================================================

  const startManualSession = useCallback(async (
    machineId: string,
    customerName: string,
    notes?: string,
    estimatedDurationMinutes?: number
  ) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.startManualSession(machineId, customerName, notes, estimatedDurationMinutes);
      if (isMountedRef.current) {
        setManualStartModal({ isOpen: false, machineId: null });
      }
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error starting manual session:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [loadData, presenter]);

  const startFromQueue = useCallback(async (
    machineId: string, 
    queue: WalkInQueue,
    estimatedDurationMinutes?: number
  ) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.startFromQueue(machineId, queue, estimatedDurationMinutes);
      if (isMountedRef.current) {
        setQueueSelectModal({ isOpen: false, machineId: null });
      }
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error starting from queue:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [loadData, presenter]);

  const startFromBooking = useCallback(async (machineId: string, booking: Booking) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.startFromBooking(machineId, booking);
      if (isMountedRef.current) {
        setCheckInModal({ isOpen: false, machineId: null, booking: null });
      }
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error starting from booking:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [loadData, presenter]);

  const endSession = useCallback(async (sessionId: string, totalAmount?: number) => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.endSession(sessionId, totalAmount);
      if (isMountedRef.current) {
        setEndSessionModal({ isOpen: false, sessionId: null });
      }
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error ending session:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [loadData, presenter]);

  const updateSessionPayment = useCallback(async (sessionId: string, status: 'paid' | 'unpaid' | 'partial') => {
    setIsUpdating(true);
    setError(null);

    try {
      await presenter.updateSessionPayment(sessionId, status);
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error updating session payment:', err);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [loadData, presenter]);

  // ============================================================
  // MODAL ACTIONS
  // ============================================================

  const openManualStartModal = useCallback((machineId: string) => {
    setManualStartModal({ isOpen: true, machineId });
    setError(null);
  }, []);

  const closeManualStartModal = useCallback(() => {
    setManualStartModal({ isOpen: false, machineId: null });
    setError(null);
  }, []);

  const openQueueSelectModal = useCallback((machineId: string) => {
    setQueueSelectModal({ isOpen: true, machineId });
    setError(null);
  }, []);

  const closeQueueSelectModal = useCallback(() => {
    setQueueSelectModal({ isOpen: false, machineId: null });
    setError(null);
  }, []);

  const openEndSessionModal = useCallback((sessionId: string) => {
    setEndSessionModal({ isOpen: true, sessionId });
    setError(null);
  }, []);

  const closeEndSessionModal = useCallback(() => {
    setEndSessionModal({ isOpen: false, sessionId: null });
    setError(null);
  }, []);

  const openCheckInModal = useCallback((machineId: string, booking: Booking) => {
    setCheckInModal({ isOpen: true, machineId, booking });
    setError(null);
  }, []);

  const closeCheckInModal = useCallback(() => {
    setCheckInModal({ isOpen: false, machineId: null, booking: null });
    setError(null);
  }, []);

  const openSessionDetailModal = useCallback((session: Session) => {
    setSessionDetailModal({ isOpen: true, session });
    setError(null);
  }, []);

  const closeSessionDetailModal = useCallback(() => {
    setSessionDetailModal({ isOpen: false, session: null });
    setError(null);
  }, []);

  const openHistoryModal = useCallback(async (machineId: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      const sessions = await presenter.getMachineHistory(machineId);
      if (isMountedRef.current) {
        setHistoryModal({ isOpen: true, machineId, sessions });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading history:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [presenter]);

  const closeHistoryModal = useCallback(() => {
    setHistoryModal({ isOpen: false, machineId: null, sessions: [] });
    setError(null);
  }, []);

  // ============================================================
  // EFFECTS
  // ============================================================

  // Initial load
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [loadData, initialViewModel]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isUpdating) {
        loadData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData, isUpdating]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return [
    {
      viewModel,
      loading,
      isUpdating,
      error,
      manualStartModal,
      queueSelectModal,
      endSessionModal,
      checkInModal,
      sessionDetailModal,
      historyModal,
    },
    {
      loadData,
      startManualSession,
      startFromQueue,
      startFromBooking,
      endSession,
      updateSessionPayment,
      openManualStartModal,
      closeManualStartModal,
      openQueueSelectModal,
      closeQueueSelectModal,
      openEndSessionModal,
      closeEndSessionModal,
      openCheckInModal,
      closeCheckInModal,
      openSessionDetailModal,
      closeSessionDetailModal,
      openHistoryModal,
      closeHistoryModal,
      setError,
    },
  ];
}
