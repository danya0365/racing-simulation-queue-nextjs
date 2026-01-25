'use client';

import type { CreateCustomerData, Customer, UpdateCustomerData } from '@/src/application/repositories/ICustomerRepository';
import { getShopTodayString } from '@/src/lib/date';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomersPresenter, CustomersViewModel } from './CustomersPresenter';
import { createClientCustomersPresenter } from './CustomersPresenterClientFactory';

export interface CustomersPresenterState {
  viewModel: CustomersViewModel | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  activeFilter: string;
  currentPage: number;
  totalCount: number;
  selectedCustomer: Customer | null;
  isDetailModalOpen: boolean;
  isAddModalOpen: boolean;
}

export interface CustomersPresenterActions {
  loadData: () => Promise<void>;
  searchCustomers: (query: string) => void;
  setFilter: (filter: string) => void;
  setPage: (page: number) => void;
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
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;

  /**
   * Load data from presenter
   */
  /**
   * Load data from presenter
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const todayStr = getShopTodayString();
      // Pass pagination params
      const vm = await presenter.getViewModel(
        todayStr, 
        ITEMS_PER_PAGE, 
        currentPage, 
        searchQuery, 
        activeFilter === 'all' ? undefined : activeFilter
      );
      
      if (isMountedRef.current) {
        setViewModel(vm);
        setTotalCount(vm.totalCount);
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
  }, [presenter, currentPage, searchQuery, activeFilter]);

  // Trigger loadData when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Search customers
   */
  const searchCustomers = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
  }, []);

  const setFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

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
      activeFilter,
      currentPage,
      totalCount,
      selectedCustomer,
      isDetailModalOpen,
      isAddModalOpen,
    },
    {
      loadData,
      searchCustomers,
      setFilter,
      setPage,
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
