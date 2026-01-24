'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerInfo {
  phone: string;
  name: string;
  id: string; // Stored DB customer UUID to enable secure lookups
}

interface ActiveBooking {
  id: string;
  machineId: string;
  customerId?: string;
  machineName: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  position: number;
  status: 'waiting' | 'called' | 'seated' | 'playing' | 'completed' | 'cancelled';
  createdAt: string;
}

interface CustomerStore {
  // State
  customerInfo: CustomerInfo;
  activeBookings: ActiveBooking[];
  bookingHistory: ActiveBooking[];
  isInitialized: boolean;
  
  // Actions
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  clearCustomerInfo: () => void;
  
  // Booking management
  addBooking: (booking: ActiveBooking) => void;
  updateBooking: (id: string, updates: Partial<ActiveBooking>) => void;
  removeBooking: (id: string) => void;
  getActiveBookings: () => ActiveBooking[];
  
  // History management
  moveToHistory: (id: string) => void;
  addToHistory: (booking: ActiveBooking) => void;
  clearHistory: () => void;
  getBookingHistory: () => ActiveBooking[];
}

const initialCustomerInfo: CustomerInfo = {
  phone: '',
  name: '',
  id: '',
};

/**
 * Customer Store - Persists customer data and bookings to localStorage
 * So users can track their active bookings and don't need to re-enter info
 */
export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customerInfo: initialCustomerInfo,
      activeBookings: [],
      bookingHistory: [],
      isInitialized: false, // Track if persisted data is loaded
      
      setCustomerInfo: (info) =>
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        })),
      
      clearCustomerInfo: () =>
        set({ customerInfo: initialCustomerInfo }),
      
      addBooking: (booking) =>
        set((state) => ({
          activeBookings: [...state.activeBookings, booking],
        })),
      
      updateBooking: (id, updates) =>
        set((state) => {
          const updatedBookings = state.activeBookings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          );
          
          // If status changed to completed or cancelled, move to history
          const booking = updatedBookings.find(b => b.id === id);
          if (booking && (updates.status === 'completed' || updates.status === 'cancelled')) {
            return {
              activeBookings: updatedBookings.filter(b => b.id !== id),
              bookingHistory: [booking, ...state.bookingHistory].slice(0, 50), // Keep last 50
            };
          }
          
          return { activeBookings: updatedBookings };
        }),
      
      removeBooking: (id) =>
        set((state) => {
          const booking = state.activeBookings.find(b => b.id === id);
          if (booking) {
            // Move to history when removing (cancelled)
            return {
              activeBookings: state.activeBookings.filter((b) => b.id !== id),
              bookingHistory: [{ ...booking, status: 'cancelled' as const }, ...state.bookingHistory].slice(0, 50),
            };
          }
          return { activeBookings: state.activeBookings.filter((b) => b.id !== id) };
        }),
      
      getActiveBookings: () => {
        const state = get();
        // Return only active bookings (waiting or playing)
        return state.activeBookings.filter(
          (b) => b.status === 'waiting' || b.status === 'called' || b.status === 'seated' || b.status === 'playing'
        );
      },
      
      moveToHistory: (id) =>
        set((state) => {
          const booking = state.activeBookings.find(b => b.id === id);
          if (!booking) return state;
          
          return {
            activeBookings: state.activeBookings.filter(b => b.id !== id),
            bookingHistory: [booking, ...state.bookingHistory].slice(0, 50),
          };
        }),
      
      addToHistory: (booking) =>
        set((state) => {
          // Remove if exists first (to update data or just move to top)
          const filteredHistory = state.bookingHistory.filter(b => b.id !== booking.id);
          return {
            bookingHistory: [booking, ...filteredHistory].slice(0, 50),
          };
        }),
      
      clearHistory: () =>
        set({ bookingHistory: [] }),
      
      getBookingHistory: () => {
        const state = get();
        return state.bookingHistory;
      },
    }),
    {
      name: 'racing-queue-customer', // localStorage key
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isInitialized = true;
        }
      },
    }
  )
);

// Export types for use in components
export type { ActiveBooking, CustomerInfo };

