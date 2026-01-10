/**
 * CustomersPresenter
 * Handles business logic for Customer management
 * Receives repository via dependency injection
 */

import {
  CreateCustomerData,
  Customer,
  CustomerStats,
  ICustomerRepository,
  UpdateCustomerData
} from '@/src/application/repositories/ICustomerRepository';

export interface CustomersViewModel {
  customers: Customer[];
  stats: CustomerStats;
}

/**
 * Presenter for Customers management
 * ✅ Receives repository via constructor injection
 */
export class CustomersPresenter {
  constructor(
    private readonly customerRepository: ICustomerRepository
  ) {}

  /**
   * Helper to wrap promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out (${ms}ms)`)), ms)
      )
    ]);
  }

  /**
   * Get all customers
   */
  async getAllCustomers(): Promise<Customer[]> {
    try {
      return await this.withTimeout(this.customerRepository.getAll());
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  }

  /**
   * Get customer stats
   */
  async getStats(): Promise<CustomerStats> {
    try {
      return await this.withTimeout(this.customerRepository.getStats());
    } catch (error) {
      console.error('Error getting customer stats:', error);
      throw error;
    }
  }

  /**
   * Search customers
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      return await this.withTimeout(this.customerRepository.search(query));
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      return await this.withTimeout(this.customerRepository.create(data));
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Update a customer
   */
  async updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    try {
      return await this.withTimeout(this.customerRepository.update(id, data));
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<boolean> {
    try {
      return await this.withTimeout(this.customerRepository.delete(id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  /**
   * Toggle VIP status
   */
  async toggleVipStatus(customer: Customer): Promise<Customer> {
    return this.updateCustomer(customer.id, { isVip: !customer.isVip });
  }

  /**
   * Get view model
   */
  async getViewModel(): Promise<CustomersViewModel> {
    // Methods are already wrapped with timeout
    const [customers, stats] = await Promise.all([
      this.getAllCustomers(),
      this.getStats(),
    ]);
    return { customers, stats };
  }
}
