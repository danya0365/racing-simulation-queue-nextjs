'use client';

import { AdvanceBooking, CreateAdvanceBookingData, DaySchedule, TimeSlot } from '@/src/application/repositories/IAdvanceBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TimeBookingPresenter, TimeBookingViewModel } from './TimeBookingPresenter';
import { createClientTimeBookingPresenter } from './TimeBookingPresenterClientFactory';

export type BookingStep = 'machine' | 'datetime' | 'info' | 'confirm';

export interface TimeBookingPresenterState {
  viewModel: TimeBookingViewModel | null;
  loading: boolean;
  error: string | null;
  // Form state
  step: BookingStep;
  selectedMachineId: string | null;
  selectedMachine: Machine | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  schedule: DaySchedule | null;
  scheduleLoading: boolean;
  // Submission state
  isSubmitting: boolean;
  success: AdvanceBooking | null;
}

export interface TimeBookingPresenterActions {
  loadData: () => Promise<void>;
  loadSchedule: (machineId: string, date: string) => Promise<void>;
  selectMachine: (machineId: string) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: TimeSlot) => void;
  setStep: (step: BookingStep) => void;
  createBooking: (data: CreateAdvanceBookingData) => Promise<AdvanceBooking>;
  reset: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for QuickAdvanceBooking presenter
 * Provides state management and actions for quick advance booking operations
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Proper cleanup on unmount
 * - Memory leak protection with isMountedRef
 */
export function useTimeBookingPresenter(
  initialViewModel?: TimeBookingViewModel,
  presenterOverride?: TimeBookingPresenter
): [TimeBookingPresenterState, TimeBookingPresenterActions] {
  // ✅ Create presenter inside hook with useMemo
  // Accept override for easier testing (Dependency Injection)
  const presenter = useMemo(
    () => presenterOverride ?? createClientTimeBookingPresenter(),
    [presenterOverride]
  );

  // ✅ Track mounted state for memory leak protection
  const isMountedRef = useRef(true);

  // Initial date (today)
  const initialDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // State
  const [viewModel, setViewModel] = useState<TimeBookingViewModel | null>(
    initialViewModel || null
  );
  const [loading, setLoading] = useState(!initialViewModel);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [step, setStep] = useState<BookingStep>('machine');
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<AdvanceBooking | null>(null);

  // Computed
  const selectedMachine = useMemo(
    () => viewModel?.machines.find(m => m.id === selectedMachineId) || null,
    [viewModel?.machines, selectedMachineId]
  );

  /**
   * Load initial data (machines)
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const newViewModel = await presenter.getViewModel();
      if (isMountedRef.current) {
        setViewModel(newViewModel);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลได้';
        setError(errorMessage);
        console.error('Error loading data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Load schedule for selected machine and date
   */
  const loadSchedule = useCallback(async (machineId: string, date: string) => {
    setScheduleLoading(true);

    try {
      const now = new Date().toISOString();
      const daySchedule = await presenter.getDaySchedule(machineId, date, now);
      if (isMountedRef.current) {
        setSchedule(daySchedule);
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Error loading schedule:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setScheduleLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Select machine and move to datetime step
   */
  const selectMachine = useCallback((machineId: string) => {
    setSelectedMachineId(machineId);
    setStep('datetime');
  }, []);

  /**
   * Select date and reload schedule
   */
  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
    // Schedule will be reloaded by useEffect
  }, []);

  /**
   * Select time slot and move to info step
   */
  const selectSlot = useCallback((slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    setSelectedSlot(slot);
    setStep('info');
  }, []);

  /**
   * Create booking
   */
  const createBooking = useCallback(async (data: CreateAdvanceBookingData): Promise<AdvanceBooking> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const booking = await presenter.createBooking(data);
      if (isMountedRef.current) {
        setSuccess(booking);
      }
      return booking;
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่';
        setError(errorMessage);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [presenter]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setStep('machine');
    setSelectedMachineId(null);
    setSelectedSlot(null);
    setSchedule(null);
    setSuccess(null);
    setError(null);
    setSelectedDate(initialDate);
  }, [initialDate]);

  // Load data on mount
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    }
  }, [initialViewModel, loadData]);

  // Load schedule when machine/date changes
  useEffect(() => {
    if (step === 'datetime' && selectedMachineId) {
      loadSchedule(selectedMachineId, selectedDate);
    }
  }, [step, selectedMachineId, selectedDate, loadSchedule]);

  // ✅ Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return [
    {
      viewModel,
      loading,
      error,
      step,
      selectedMachineId,
      selectedMachine,
      selectedDate,
      selectedSlot,
      schedule,
      scheduleLoading,
      isSubmitting,
      success,
    },
    {
      loadData,
      loadSchedule,
      selectMachine,
      selectDate,
      selectSlot,
      setStep,
      createBooking,
      reset,
      setError,
    },
  ];
}
