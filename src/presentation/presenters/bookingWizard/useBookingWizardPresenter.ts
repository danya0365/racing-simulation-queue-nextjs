'use client';

import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    BookingWizardPresenter,
    BookingWizardViewModel
} from './BookingWizardPresenter';
import { createClientBookingWizardPresenter } from './BookingWizardPresenterClientFactory';

export type BookingStep = 'phone' | 'machine' | 'duration' | 'confirm';

export interface BookingData {
  customerPhone: string;
  customerName: string;
  machineId: string;
  machineName: string;
  duration: number;
  isExistingCustomer: boolean;
  estimatedWait: number;
  queuePosition: number;
}

export interface BookingWizardPresenterState {
  viewModel: BookingWizardViewModel | null;
  loading: boolean;
  error: string | null;
  currentStep: BookingStep;
  bookingData: BookingData;
  submitting: boolean;
  success: { queueId: string; position: number } | null;
}

export interface BookingWizardPresenterActions {
  loadData: () => Promise<void>;
  setCurrentStep: (step: BookingStep) => void;
  goNext: () => void;
  goBack: () => void;
  updateBookingData: (data: Partial<BookingData>) => void;
  submitBooking: () => Promise<void>;
  setError: (error: string | null) => void;
}

const STEPS: BookingStep[] = ['phone', 'machine', 'duration', 'confirm'];

/**
 * Custom hook for BookingWizard presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Proper cleanup on unmount
 */
export function useBookingWizardPresenter(
  presenterOverride?: BookingWizardPresenter
): [BookingWizardPresenterState, BookingWizardPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientBookingWizardPresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const { customerInfo, setCustomerInfo, addBooking, isInitialized } = useCustomerStore();
  
  const [viewModel, setViewModel] = useState<BookingWizardViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<BookingStep>('phone');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ queueId: string; position: number } | null>(null);
  
  const [bookingData, setBookingData] = useState<BookingData>({
    customerPhone: '',
    customerName: '',
    machineId: '',
    machineName: '',
    duration: 30,
    isExistingCustomer: false,
    estimatedWait: 0,
    queuePosition: 1,
  });

  // Update booking data from store when initialized
  useEffect(() => {
    if (isInitialized) {
      setBookingData(prev => ({
        ...prev,
        customerPhone: customerInfo.phone || '',
        customerName: customerInfo.name || '',
      }));
    }
  }, [isInitialized, customerInfo]);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const vm = await presenter.getViewModel(todayStr);
      if (isMountedRef.current) {
        setViewModel(vm);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading booking wizard data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Go to next step
   */
  const goNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  /**
   * Go to previous step
   */
  const goBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  /**
   * Update booking data
   */
  const updateBookingData = useCallback((data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  }, []);

  /**
   * Submit booking
   */
  const submitBooking = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const bookingTime = new Date();
      bookingTime.setMinutes(bookingTime.getMinutes() + 5);

      const newQueue = await presenter.createBooking({
        machineId: bookingData.machineId,
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        bookingTime: bookingTime.toISOString(),
        duration: bookingData.duration,
      });

      // Save customer info to store for next time
      setCustomerInfo({
        phone: bookingData.customerPhone,
        name: bookingData.customerName,
        id: newQueue.customerId,
      });

      // Add to active bookings
      addBooking({
        id: newQueue.id,
        machineId: newQueue.machineId,
        machineName: bookingData.machineName,
        customerName: newQueue.customerName,
        customerPhone: newQueue.customerPhone,
        bookingTime: newQueue.bookingTime,
        duration: newQueue.duration,
        position: newQueue.position,
        status: newQueue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
        createdAt: new Date().toISOString(),
      });

      if (isMountedRef.current) {
        setSuccess({
          queueId: newQueue.id,
          position: newQueue.position,
        });
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาด';
        setError(errorMessage);
        console.error('Error submitting booking:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  }, [bookingData, setCustomerInfo, addBooking, presenter]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

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
      currentStep,
      bookingData,
      submitting,
      success,
    },
    {
      loadData,
      setCurrentStep,
      goNext,
      goBack,
      updateBookingData,
      submitBooking,
      setError,
    },
  ];
}
