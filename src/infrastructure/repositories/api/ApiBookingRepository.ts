/**
 * ApiBookingRepository
 * Implements IBookingRepository using API calls instead of direct Supabase connection
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 * ✅ Uses new TIMESTAMPTZ-based booking system
 */

'use client';

import {
    Booking,
    BookingDaySchedule,
    BookingLog,
    BookingStats,
    CreateBookingData,
    IBookingRepository,
    UpdateBookingData,
} from '@/src/application/repositories/IBookingRepository';

export class ApiBookingRepository implements IBookingRepository {
  private baseUrl = '/api/bookings';

  /**
   * Get schedule for a specific day and machine
   * Supports timezone-aware queries
   */
  async getDaySchedule(
    machineId: string, 
    date: string, 
    timezone: string,
    referenceTime?: string,
    customerId?: string
  ): Promise<BookingDaySchedule> {
    const params = new URLSearchParams({ machineId, date, timezone });
    if (referenceTime) {
      params.append('referenceTime', referenceTime);
    }
    if (customerId) {
      params.append('customerId', customerId);
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
  async getById(id: string): Promise<Booking | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Get all bookings for the current customer (by customer_id)
   * SECURE: Only returns bookings that belong to this customer_id
   */
  async getMyBookings(customerId: string): Promise<Booking[]> {
    const res = await fetch(`${this.baseUrl}/my-bookings?customerId=${encodeURIComponent(customerId)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Get all bookings for a machine on a date
   */
  async getByMachineAndDate(machineId: string, date: string, customerId?: string): Promise<Booking[]> {
    const params = new URLSearchParams({ machineId, date });
    if (customerId) params.append('customerId', customerId);
    
    const res = await fetch(`${this.baseUrl}?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Get all bookings for a specific date (across all machines)
   */
  async getByDate(date: string, customerId?: string): Promise<Booking[]> {
    const params = new URLSearchParams({ date });
    if (customerId) params.append('customerId', customerId);
    
    const res = await fetch(`${this.baseUrl}?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลการจองได้');
    }
    return res.json();
  }

  /**
   * Create a new booking
   */
  async create(data: CreateBookingData): Promise<Booking> {
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
   * Update an existing booking
   */
  async update(id: string, data: UpdateBookingData): Promise<Booking> {
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
   * Cancel a booking
   */
  async cancel(id: string, customerId?: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', customerId }),
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
  async isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    timezone?: string
  ): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId, date, startTime, durationMinutes, timezone }),
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
  async getStats(): Promise<BookingStats> {
    const res = await fetch(`${this.baseUrl}?action=stats`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }

  /**
   * Log a session action (START/STOP)
   */
  async logSession(bookingId: string, action: 'START' | 'STOP'): Promise<void> {
    const res = await fetch(`${this.baseUrl}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, action }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถบันทึกเซสชันได้');
    }
  }

  /**
   * Get session logs for a list of bookings
   */
  async getSessionLogs(bookingIds: string[]): Promise<BookingLog[]> {
    if (bookingIds.length === 0) return [];
    
    const res = await fetch(`${this.baseUrl}/logs?ids=${bookingIds.join(',')}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลด logs ได้');
    }
    return res.json();
  }
}
