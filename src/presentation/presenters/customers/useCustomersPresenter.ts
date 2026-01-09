'use client';

import type { CreateCustomerData, Customer, UpdateCustomerData } from '@/src/application/repositories/ICustomerRepository';
import { useCallback, useEffect, useState } from 'react';
import { CustomersViewModel } from './CustomersPresenter';
import { createClientCustomersPresenter } from './CustomersPresenterClientFactory';

// Initialize presenter instance once (singleton pattern)
const presenter = createClientCustomersPresenter();

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
 * Provides state management and actions for Customer management operations
 * ✅ Following Clean Architecture pattern
 */
export function useCustomersPresenter(): [CustomersPresenterState, CustomersPresenterActions] {
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
      setViewModel(vm);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading customers data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Search customers
   */
  const searchCustomers = useCallback(async (query: string) => {
    setSearchQuery(query);
    setError(null);

    try {
      if (query.trim()) {
        const customers = await presenter.searchCustomers(query);
        setViewModel(prev => prev ? { ...prev, customers } : null);
      } else {
        const customers = await presenter.getAllCustomers();
        setViewModel(prev => prev ? { ...prev, customers } : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error searching customers:', err);
    }
  }, []);

  /**
   * Create a new customer
   */
  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    setError(null);

    try {
      await presenter.createCustomer(data);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating customer:', err);
      throw err;
    }
  }, [loadData]);

  /**
   * Update a customer
   */
  const updateCustomer = useCallback(async (id: string, data: UpdateCustomerData) => {
    setError(null);

    try {
      await presenter.updateCustomer(id, data);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error updating customer:', err);
      throw err;
    }
  }, [loadData]);

  /**
   * Toggle VIP status
   */
  const toggleVipStatus = useCallback(async (customer: Customer) => {
    setError(null);

    try {
      await presenter.toggleVipStatus(customer);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error toggling VIP status:', err);
    }
  }, [loadData]);

  /**
   * Delete a customer
   */
  const deleteCustomer = useCallback(async (id: string) => {
    setError(null);

    try {
      await presenter.deleteCustomer(id);
      await loadData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting customer:', err);
    }
  }, [loadData]);

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
