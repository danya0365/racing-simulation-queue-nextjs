/**
 * Mock Customer Repository
 * In-memory implementation for development
 */

import {
    CreateCustomerData,
    Customer,
    CustomerStats,
    ICustomerRepository,
    UpdateCustomerData,
} from '@/src/application/repositories/ICustomerRepository';
import { CUSTOMER_CONFIG } from '@/src/config/customerConfig';

// Mock data with sample customers
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'สมชาย ใจดี',
    phone: '081-234-5678',
    email: 'somchai@example.com',
    visitCount: 12,
    totalPlayTime: 720,
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'ลูกค้าประจำ ชอบเครื่อง 1',
    isVip: true,
  },
  {
    id: 'cust-2',
    name: 'สมหญิง รักเกม',
    phone: '082-345-6789',
    visitCount: 8,
    totalPlayTime: 480,
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isVip: true,
  },
  {
    id: 'cust-3',
    name: 'วิชัย เร็วแรง',
    phone: '083-456-7890',
    visitCount: 5,
    totalPlayTime: 300,
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isVip: false,
  },
  {
    id: 'cust-4',
    name: 'มานี มีสุข',
    phone: '084-567-8901',
    visitCount: 3,
    totalPlayTime: 180,
    lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    isVip: false,
  },
  {
    id: 'cust-5',
    name: 'ณัฐพล สปีด',
    phone: '085-678-9012',
    email: 'nattapon@example.com',
    visitCount: 1,
    totalPlayTime: 60,
    lastVisit: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: 'ลูกค้าใหม่',
    isVip: false,
  },
];

export class MockCustomerRepository implements ICustomerRepository {
  private customers: Customer[] = [...mockCustomers];

  async getAll(): Promise<Customer[]> {
    // Sort by last visit, most recent first
    return [...this.customers].sort((a, b) => {
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
  }

  async getById(id: string): Promise<Customer | null> {
    return this.customers.find((c) => c.id === id) || null;
  }

  async getByPhone(phone: string): Promise<Customer | null> {
    // Normalize phone for comparison
    const normalizedPhone = phone.replace(/[-\s]/g, '');
    return this.customers.find((c) => 
      c.phone.replace(/[-\s]/g, '') === normalizedPhone
    ) || null;
  }

  async search(query: string): Promise<Customer[]> {
    const lowerQuery = query.toLowerCase();
    return this.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query)
    );
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: data.name,
      phone: data.phone,
      email: data.email,
      visitCount: 0,
      totalPlayTime: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: data.notes,
      isVip: false,
    };

    this.customers.push(newCustomer);
    return newCustomer;
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    this.customers[index] = {
      ...this.customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return this.customers[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) {
      return false;
    }

    this.customers.splice(index, 1);
    return true;
  }

  async incrementVisit(id: string, playTime: number, now: string): Promise<Customer> {
    const customer = await this.getById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }

    const index = this.customers.findIndex((c) => c.id === id);
    this.customers[index] = {
      ...customer,
      visitCount: customer.visitCount + 1,
      totalPlayTime: customer.totalPlayTime + playTime,
      lastVisit: now,
      updatedAt: now,
    };

    return this.customers[index];
  }

  async getStats(todayStr: string): Promise<CustomerStats> {
    const today = new Date(todayStr);
    today.setHours(0, 0, 0, 0);

    const newToday = this.customers.filter((c) => {
      const createdAt = new Date(c.createdAt);
      return createdAt >= today;
    }).length;

    return {
      totalCustomers: this.customers.length,
      vipCustomers: this.customers.filter((c) => c.isVip).length,
      newCustomersToday: newToday,
      returningCustomers: this.customers.filter((c) => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS).length,
    };
  }

  async getVipCustomers(): Promise<Customer[]> {
    return this.customers.filter((c) => c.isVip);
  }

  async getFrequentCustomers(): Promise<Customer[]> {
    return this.customers
      .filter((c) => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS)
      .sort((a, b) => b.visitCount - a.visitCount);
  }
}
