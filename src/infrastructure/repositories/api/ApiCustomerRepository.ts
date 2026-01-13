/**
 * ApiCustomerRepository
 * Implements ICustomerRepository using API calls instead of direct Supabase connection
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
    CreateCustomerData,
    Customer,
    CustomerStats,
    ICustomerRepository,
    UpdateCustomerData,
} from '@/src/application/repositories/ICustomerRepository';

export class ApiCustomerRepository implements ICustomerRepository {
  private baseUrl = '/api/customers';

  /**
   * Get all customers
   */
  async getAll(): Promise<Customer[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Get customer by phone number
   */
  async getByPhone(phone: string): Promise<Customer | null> {
    const res = await fetch(`${this.baseUrl}?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Search customers by name or phone
   */
  async search(query: string): Promise<Customer[]> {
    const res = await fetch(`${this.baseUrl}?query=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถค้นหาลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerData): Promise<Customer> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถสร้างลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Update customer
   */
  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Delete customer
   */
  async delete(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถลบลูกค้าได้');
    }
    return true;
  }

  /**
   * Increment visit count
   */
  async incrementVisit(id: string, playTime: number, now: string): Promise<Customer> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'incrementVisit', playTime, now }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Get customer statistics
   */
  async getStats(todayDate: string): Promise<CustomerStats> {
    const res = await fetch(`${this.baseUrl}?action=stats&todayDate=${todayDate}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }

  /**
   * Get VIP customers
   */
  async getVipCustomers(): Promise<Customer[]> {
    const res = await fetch(`${this.baseUrl}?action=vip`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
    return res.json();
  }

  /**
   * Get frequent customers (5+ visits)
   */
  async getFrequentCustomers(): Promise<Customer[]> {
    const res = await fetch(`${this.baseUrl}?action=frequent`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลลูกค้าได้');
    }
    return res.json();
  }
}
