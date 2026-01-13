/**
 * ApiAdvanceBookingRepository
 * Implements IAdvanceBookingRepository using API calls instead of direct Supabase connection
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
    AdvanceBooking,
    AdvanceBookingStats,
    CreateAdvanceBookingData,
    DaySchedule,
    IAdvanceBookingRepository,
    UpdateAdvanceBookingData,
} from '@/src/application/repositories/IAdvanceBookingRepository';

export class ApiAdvanceBookingRepository implements IAdvanceBookingRepository {
  private baseUrl = '/api/advance-bookings';

  /**
   * Get schedule for a specific day and machine
   */
  async getDaySchedule(machineId: string, date: string, referenceTime?: string): Promise<DaySchedule> {
    const params = new URLSearchParams({ machineId, date });
    if (referenceTime) {
      params.append('referenceTime', referenceTime);
    }
    const res = await fetch(`${this.baseUrl}/schedule?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดตารางได้');
    }
    return res.json();
  }

  /**
   * Get available dates (next N days)
   */
  async getAvailableDates(todayStr: string, daysAhead?: number): Promise<string[]> {
    const params = new URLSearchParams({ action: 'availableDates', todayStr });
    if (daysAhead) {
      params.append('daysAhead', daysAhead.toString());
    }
    const res = await fetch(`${this.baseUrl}?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดวันที่ได้');
    }
    return res.json();
  }

  /**
   * Get booking by ID
   */
  async getById(id: string): Promise<AdvanceBooking | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Get all advance bookings for a customer
   */
  async getByCustomerPhone(phone: string): Promise<AdvanceBooking[]> {
    const res = await fetch(`${this.baseUrl}/by-phone?phone=${encodeURIComponent(phone)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Get all advance bookings for a machine on a date
   */
  async getByMachineAndDate(machineId: string, date: string): Promise<AdvanceBooking[]> {
    const params = new URLSearchParams({ machineId, date });
    const res = await fetch(`${this.baseUrl}?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Create a new advance booking
   */
  async create(data: CreateAdvanceBookingData): Promise<AdvanceBooking> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถสร้างการจองได้');
    }
    return res.json();
  }

  /**
   * Update an existing advance booking
   */
  async update(id: string, data: UpdateAdvanceBookingData): Promise<AdvanceBooking> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตการจองได้');
    }
    return res.json();
  }

  /**
   * Cancel an advance booking
   */
  async cancel(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถยกเลิกการจองได้');
    }
    const result = await res.json();
    return result.success;
  }

  /**
   * Check if a time slot is available
   */
  async isSlotAvailable(machineId: string, date: string, startTime: string, duration: number, referenceTime?: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId, date, startTime, duration, referenceTime }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถตรวจสอบสล็อตได้');
    }
    const result = await res.json();
    return result.available;
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<AdvanceBookingStats> {
    const res = await fetch(`${this.baseUrl}?action=stats`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }
}
