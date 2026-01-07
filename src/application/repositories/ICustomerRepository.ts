/**
 * Customer Repository Interface
 * Defines the contract for Customer data access
 */

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visitCount: number;
  totalPlayTime: number; // in minutes
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  isVip: boolean;
}

export interface CreateCustomerData {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
  isVip?: boolean;
}

export interface CustomerStats {
  totalCustomers: number;
  vipCustomers: number;
  newCustomersToday: number;
  returningCustomers: number;
}

export interface ICustomerRepository {
  /**
   * Get all customers
   */
  getAll(): Promise<Customer[]>;

  /**
   * Get customer by ID
   */
  getById(id: string): Promise<Customer | null>;

  /**
   * Get customer by phone number
   */
  getByPhone(phone: string): Promise<Customer | null>;

  /**
   * Search customers by name or phone
   */
  search(query: string): Promise<Customer[]>;

  /**
   * Create a new customer
   */
  create(data: CreateCustomerData): Promise<Customer>;

  /**
   * Update customer
   */
  update(id: string, data: UpdateCustomerData): Promise<Customer>;

  /**
   * Delete customer
   */
  delete(id: string): Promise<boolean>;

  /**
   * Increment visit count
   */
  incrementVisit(id: string, playTime: number): Promise<Customer>;

  /**
   * Get customer statistics
   */
  getStats(): Promise<CustomerStats>;

  /**
   * Get VIP customers
   */
  getVipCustomers(): Promise<Customer[]>;

  /**
   * Get frequent customers (5+ visits)
   */
  getFrequentCustomers(): Promise<Customer[]>;
}
