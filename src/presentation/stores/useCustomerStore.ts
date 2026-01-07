'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerInfo {
  phone: string;
  name: string;
}

interface CustomerStore {
  // State
  customerInfo: CustomerInfo;
  
  // Actions
  setCustomerInfo: (info: Partial<CustomerInfo>) => void;
  clearCustomerInfo: () => void;
}

const initialCustomerInfo: CustomerInfo = {
  phone: '',
  name: '',
};

/**
 * Customer Store - Persists customer data to localStorage
 * So users don't need to re-enter their info every time
 */
export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set) => ({
      customerInfo: initialCustomerInfo,
      
      setCustomerInfo: (info) =>
        set((state) => ({
          customerInfo: { ...state.customerInfo, ...info },
        })),
      
      clearCustomerInfo: () =>
        set({ customerInfo: initialCustomerInfo }),
    }),
    {
      name: 'racing-queue-customer', // localStorage key
    }
  )
);
