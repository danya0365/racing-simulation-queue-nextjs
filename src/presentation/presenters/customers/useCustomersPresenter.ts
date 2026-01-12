'use client';

import type { CreateCustomerData, Customer, UpdateCustomerData } from '@/src/application/repositories/ICustomerRepository';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomersPresenter, CustomersViewModel } from './CustomersPresenter';
import { createClientCustomersPresenter } from './CustomersPresenterClientFactory';

export interface CustomersPresenterState {
  viewModel: CustomersViewModel | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCustomer: Customer | null;
  isDetailModalOpen: boolean;
  isAddModalOpen: boolean;
}

export interface CustomersPresenterActions {
  loadData: () => Promise<void>;
  searchCustomers: (query: string) => Promise<void>;
  createCustomer: (data: CreateCustomerData) => Promise<void>;
  updateCustomer: (id: string, data: UpdateCustomerData) => Promise<void>;
  toggleVipStatus: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  openDetailModal: (customer: Customer) => void;
  closeDetailModal: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  setError: (error: string | null) => void;
}

/**
 * Custom hook for Customers presenter
 * 
 * ✅ Improvements:
 * - Presenter created inside hook with useMemo
 * - Proper cleanup on unmount
 */
export function useCustomersPresenter(
  presenterOverride?: CustomersPresenter
): [CustomersPresenterState, CustomersPresenterActions] {
  // ✅ Create presenter inside hook
  // Accept override for easier testing
  const presenter = useMemo(
    () => presenterOverride ?? createClientCustomersPresenter(),
    [presenterOverride]
  );
  
  // ✅ Track mounted state
  const isMountedRef = useRef(true);

  const [viewModel, setViewModel] = useState<CustomersViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vm = await presenter.getViewModel();
      if (isMountedRef.current) {
        setViewModel(vm);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error loading customers data:', err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [presenter]);

  /**
   * Search customers
   */
  const searchCustomers = useCallback(async (query: string) => {
    setSearchQuery(query);
    setError(null);

    try {
      if (query.trim()) {
        const customers = await presenter.searchCustomers(query);
        if (isMountedRef.current) {
          setViewModel(prev => prev ? { ...prev, customers } : null);
        }
      } else {
        const customers = await presenter.getAllCustomers();
        if (isMountedRef.current) {
          setViewModel(prev => prev ? { ...prev, customers } : null);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error searching customers:', err);
      }
    }
  }, [presenter]);

  /**
   * Create a new customer
   */
  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    setError(null);

    try {
      await presenter.createCustomer(data);
      if (isMountedRef.current) {
        setIsAddModalOpen(false);
      }
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error creating customer:', err);
      }
      throw err;
    }
  }, [loadData, presenter]);

  /**
   * Update a customer
   */
  const updateCustomer = useCallback(async (id: string, data: UpdateCustomerData) => {
    setError(null);

    try {
      await presenter.updateCustomer(id, data);
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error updating customer:', err);
      }
      throw err;
    }
  }, [loadData, presenter]);

  /**
   * Toggle VIP status
   */
  const toggleVipStatus = useCallback(async (customer: Customer) => {
    setError(null);

    try {
      await presenter.toggleVipStatus(customer);
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error toggling VIP status:', err);
      }
    }
  }, [loadData, presenter]);

  /**
   * Delete a customer
   */
  const deleteCustomer = useCallback(async (id: string) => {
    setError(null);

    try {
      await presenter.deleteCustomer(id);
      await loadData();
    } catch (err) {
      if (isMountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error deleting customer:', err);
      }
    }
  }, [loadData, presenter]);

  /**
   * Open detail modal
   */
  const openDetailModal = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  }, []);

  /**
   * Close detail modal
   */
  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  }, []);

  /**
   * Open add modal
   */
  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  /**
   * Close add modal
   */
  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

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
      searchQuery,
      selectedCustomer,
      isDetailModalOpen,
      isAddModalOpen,
    },
    {
      loadData,
      searchCustomers,
      createCustomer,
      updateCustomer,
      toggleVipStatus,
      deleteCustomer,
      openDetailModal,
      closeDetailModal,
      openAddModal,
      closeAddModal,
      setError,
    },
  ];
}
