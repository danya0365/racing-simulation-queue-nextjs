'use client';

import type {
    AdvanceBooking,
    CreateAdvanceBookingData,
    DaySchedule,
    TimeSlot
} from '@/src/application/repositories/IAdvanceBookingRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdvanceBookingPresenter, AdvanceBookingViewModel } from './AdvanceBookingPresenter';
import { createClientAdvanceBookingPresenter } from './AdvanceBookingPresenterClientFactory';

export interface AdvanceBookingPresenterState {
  viewModel: AdvanceBookingViewModel | null;
  daySchedule: DaySchedule | null;
  selectedTimeSlot: TimeSlot | null;
  loading: boolean;
  scheduleLoading: boolean;
  error: string | null;
  isBookingModalOpen: boolean;
  isSubmitting: boolean;
  bookingSuccess: AdvanceBooking | null;
}

export interface AdvanceBookingPresenterActions {
  loadData: () => Promise<void>;
  selectMachine: (machineId: string) => void;
  selectDate: (date: string) => Promise<void>;
  selectTimeSlot: (timeSlot: TimeSlot) => void;
  clearTimeSlot: () => void;
  openBookingModal: () => void;
  closeBookingModal: () => void;
  submitBooking: (data: Omit<CreateAdvanceBookingData, 'machineId' | 'bookingDate' | 'startTime'>) => Promise<void>;
  clearBookingSuccess: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for AdvanceBooking presenter
 * Provides state management and actions for advance booking operations
 */
export function useAdvanceBookingPresenter(
  initialViewModel?: AdvanceBookingViewModel,
  presenterOverride?: AdvanceBookingPresenter
): [AdvanceBookingPresenterState, AdvanceBookingPresenterActions] {
  // Create presenter inside hook with useMemo
  const presenter = useMemo(
    () => presenterOverride ?? createClientAdvanceBookingPresenter(),
    [presenterOverride]
  );

  // Track mounted state for memory leak protection
  const isMountedRef = useRef(true);

  // State
  const [viewModel, setViewModel] = useState<AdvanceBookingViewModel | null>(initialViewModel || null);
  const [daySchedule, setDaySchedule] = useState<DaySchedule | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(!initialViewModel);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<AdvanceBooking | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load initial data
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowStr = now.toISOString();
      
      const vm = await presenter.getViewModel(todayStr);
      if (isMountedRef.current) {
        setViewModel(vm);
        
        // Auto-load schedule for first machine and date
        if (vm.selectedMachineId && vm.selectedDate) {
          const schedule = await presenter.getDaySchedule(vm.selectedMachineId, vm.selectedDate, nowStr);
          if (isMountedRef.current) {
            setDaySchedule(schedule);
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
  }, [presenter]);

  // Load data on mount if no initial data
  useEffect(() => {
    if (!initialViewModel) {
      loadData();
    } else if (initialViewModel.selectedMachineId && initialViewModel.selectedDate) {
      // Load schedule for initial selection
      const nowStr = new Date().toISOString();
      presenter.getDaySchedule(initialViewModel.selectedMachineId, initialViewModel.selectedDate, nowStr)
        .then(schedule => {
          if (isMountedRef.current) {
            setDaySchedule(schedule);
          }
        })
        .catch(err => {
          console.error('Error loading initial schedule:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Select machine
  const selectMachine = useCallback((machineId: string) => {
    if (!viewModel) return;
    
    setViewModel(prev => prev ? { ...prev, selectedMachineId: machineId } : null);
    setSelectedTimeSlot(null);
    setDaySchedule(null);
    
    // Load schedule for new machine
    if (viewModel.selectedDate) {
      setScheduleLoading(true);
      const nowStr = new Date().toISOString();
      presenter.getDaySchedule(machineId, viewModel.selectedDate, nowStr)
        .then(schedule => {
          if (isMountedRef.current) {
            setDaySchedule(schedule);
          }
        })
        .catch(err => {
          if (isMountedRef.current) {
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
          }
        })
        .finally(() => {
          if (isMountedRef.current) {
            setScheduleLoading(false);
          }
        });
    }
  }, [viewModel, presenter]);

  // Select date
  const selectDate = useCallback(async (date: string) => {
    if (!viewModel?.selectedMachineId) return;
    
    setViewModel(prev => prev ? { ...prev, selectedDate: date } : null);
    setSelectedTimeSlot(null);
    setScheduleLoading(true);
    setError(null);

    try {
      const nowStr = new Date().toISOString();
      const schedule = await presenter.getDaySchedule(viewModel.selectedMachineId, date, nowStr);
      if (isMountedRef.current) {
        setDaySchedule(schedule);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดตารางเวลา');
      }
    } finally {
      if (isMountedRef.current) {
        setScheduleLoading(false);
      }
    }
  }, [viewModel?.selectedMachineId, presenter]);

  // Select time slot
  const selectTimeSlot = useCallback((timeSlot: TimeSlot) => {
    if (timeSlot.status !== 'available') return;
    setSelectedTimeSlot(timeSlot);
  }, []);

  // Clear time slot
  const clearTimeSlot = useCallback(() => {
    setSelectedTimeSlot(null);
  }, []);

  // Open booking modal
  const openBookingModal = useCallback(() => {
    if (!selectedTimeSlot || selectedTimeSlot.status !== 'available') return;
    setIsBookingModalOpen(true);
  }, [selectedTimeSlot]);

  // Close booking modal
  const closeBookingModal = useCallback(() => {
    setIsBookingModalOpen(false);
    setError(null);
  }, []);

  // Submit booking
  const submitBooking = useCallback(async (
    data: Omit<CreateAdvanceBookingData, 'machineId' | 'bookingDate' | 'startTime'>
  ) => {
    if (!viewModel?.selectedMachineId || !viewModel.selectedDate || !selectedTimeSlot) {
      setError('กรุณาเลือกเครื่อง วันที่ และเวลาก่อนจอง');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const nowStr = new Date().toISOString();
      const booking = await presenter.createBooking({
        ...data,
        machineId: viewModel.selectedMachineId,
        bookingDate: viewModel.selectedDate,
        startTime: selectedTimeSlot.startTime,
      }, nowStr);

      if (isMountedRef.current) {
        setBookingSuccess(booking);
        setIsBookingModalOpen(false);
        setSelectedTimeSlot(null);
        
        // Refresh schedule
        const nowStr = new Date().toISOString();
        const newSchedule = await presenter.getDaySchedule(
          viewModel.selectedMachineId,
          viewModel.selectedDate,
          nowStr
        );
        if (isMountedRef.current) {
          setDaySchedule(newSchedule);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการจอง');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  }, [viewModel, selectedTimeSlot, presenter]);

  // Clear booking success
  const clearBookingSuccess = useCallback(() => {
    setBookingSuccess(null);
  }, []);

  const state: AdvanceBookingPresenterState = {
    viewModel,
    daySchedule,
    selectedTimeSlot,
    loading,
    scheduleLoading,
    error,
    isBookingModalOpen,
    isSubmitting,
    bookingSuccess,
  };

  const actions: AdvanceBookingPresenterActions = {
    loadData,
    selectMachine,
    selectDate,
    selectTimeSlot,
    clearTimeSlot,
    openBookingModal,
    closeBookingModal,
    submitBooking,
    clearBookingSuccess,
    setError,
  };

  return [state, actions];
}
