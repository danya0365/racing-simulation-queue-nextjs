/**
 * SupabaseAdvanceBookingRepository
 * Implementation of IAdvanceBookingRepository using Supabase
 * Following Clean Architecture - Infrastructure layer
 */

import {
  AdvanceBooking,
  AdvanceBookingStats,
  BookingSessionLog,
  CreateAdvanceBookingData,
  DaySchedule,
  IAdvanceBookingRepository,
  TimeSlot,
  TimeSlotStatus,
  UpdateAdvanceBookingData,
} from '@/src/application/repositories/IAdvanceBookingRepository';
import { OPERATING_HOURS } from '@/src/config/booking.config';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// Operating hours configuration - moved to booking.config.ts
const OPENING_HOUR = OPERATING_HOURS.isOpen24Hours ? 0 : OPERATING_HOURS.open;
const CLOSING_HOUR = OPERATING_HOURS.isOpen24Hours ? 24 : OPERATING_HOURS.close;
const SLOT_DURATION_MINUTES = OPERATING_HOURS.slotDurationMinutes;

export class SupabaseAdvanceBookingRepository implements IAdvanceBookingRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getDaySchedule(machineId: string, date: string, referenceTime?: string): Promise<DaySchedule> {
    // Get bookings for this date from RPC
    const { data: bookings, error } = await this.supabase
      .rpc('rpc_get_advance_schedule', {
        p_machine_id: machineId,
        p_date: date,
      });

    if (error) {
      console.error('Error fetching advance schedule:', error);
    }

    // Create a map of booked time slots
    const bookedSlots = new Map<string, string>();
    if (bookings) {
      (bookings as Database['public']['Functions']['rpc_get_advance_schedule']['Returns']).forEach((booking) => {
        // Parse start_time and end_time
        const startParts = booking.start_time.split(':');
        const endParts = booking.end_time.split(':');
        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        let endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        
        // Handle cross-midnight bookings (e.g., 22:30 - 01:30)
        // If end_time < start_time, it means the booking goes past midnight
        // For the CURRENT DAY's view, we only show slots up to 24:00 (end of day)
        if (endMinutes <= startMinutes) {
          // Booking crosses midnight - for this day's schedule, mark slots until end of day (24:00)
          endMinutes = 24 * 60; // Mark all slots from start to midnight
        }
        
        // Mark all slots covered by this booking
        for (let m = startMinutes; m < endMinutes; m += SLOT_DURATION_MINUTES) {
          const hour = Math.floor(m / 60);
          const minute = m % 60;
          const timeKey = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          bookedSlots.set(timeKey, booking.booking_id);
        }
      });
    }

    const timeSlots = this.generateTimeSlots(date, bookedSlots, referenceTime);
    const availableSlots = timeSlots.filter(s => s.status === 'available').length;
    const bookedCount = timeSlots.filter(s => s.bookingId !== undefined).length;

    return {
      date,
      machineId,
      timeSlots,
      totalSlots: timeSlots.length,
      availableSlots,
      bookedSlots: bookedCount,
    };
  }

  async getAvailableDates(todayStr: string, daysAhead: number = 7): Promise<string[]> {
    const dates: string[] = [];
    const startDate = dayjs(todayStr);
    
    for (let i = 0; i < daysAhead; i++) {
      const date = startDate.add(i, 'day');
      dates.push(date.format('YYYY-MM-DD'));
    }
    
    return dates;
  }

  async getById(id: string): Promise<AdvanceBooking | null> {
    const { data, error } = await this.supabase
      .from('advance_bookings')
      .select(`
        *,
        customers (name, phone)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getByCustomerPhone(phone: string): Promise<AdvanceBooking[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_customer_advance_bookings', {
        p_phone: phone,
      });

    if (error || !data) {
      console.error('Error fetching customer advance bookings:', error);
      return [];
    }

    return (data as Database['public']['Functions']['rpc_get_customer_advance_bookings']['Returns']).map(row => ({
      id: row.booking_id,
      machineId: row.machine_id,
      customerName: '', // Not returned by this RPC
      customerPhone: phone,
      bookingDate: row.booking_date,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      status: row.status as AdvanceBooking['status'],
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
  }

  async getByMachineAndDate(machineId: string, date: string): Promise<AdvanceBooking[]> {
    const { data, error } = await this.supabase
      .from('advance_bookings')
      .select(`
        *,
        customers (name, phone)
      `)
      .eq('machine_id', machineId)
      .eq('booking_date', date)
      .order('start_time');

    if (error) {
      console.error('Error fetching advance bookings:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async create(data: CreateAdvanceBookingData): Promise<AdvanceBooking> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_create_advance_booking', {
        p_machine_id: data.machineId,
        p_customer_name: data.customerName,
        p_customer_phone: data.customerPhone,
        p_booking_date: data.bookingDate,
        p_start_time: data.startTime,
        p_duration: data.duration,
        p_notes: data.notes || undefined,
      });

    if (error) {
      console.error('Error creating advance booking:', error);
      throw new Error('เกิดข้อผิดพลาดในการสร้างการจอง');
    }

    const rpcResult = result as any; // RPC returns Json, casting to any is okay here if we use it via property access or cast to expected shape
    if (!rpcResult.success) {
      throw new Error(rpcResult.error || 'เกิดข้อผิดพลาดในการสร้างการจอง');
    }

    return {
      id: rpcResult.booking.id,
      machineId: rpcResult.booking.machineId,
      customerId: rpcResult.booking.customerId,
      customerName: rpcResult.booking.customerName,
      customerPhone: rpcResult.booking.customerPhone,
      bookingDate: rpcResult.booking.bookingDate,
      startTime: rpcResult.booking.startTime,
      endTime: rpcResult.booking.endTime,
      duration: rpcResult.booking.duration,
      status: rpcResult.booking.status,
      createdAt: rpcResult.booking.createdAt,
      updatedAt: rpcResult.booking.createdAt,
    };
  }

  async update(id: string, data: UpdateAdvanceBookingData): Promise<AdvanceBooking> {
    const { data: updated, error } = await this.supabase
      .from('advance_bookings')
      .update({
        booking_date: data.bookingDate,
        start_time: data.startTime,
        duration: data.duration,
        status: data.status,
        notes: data.notes,
      })
      .eq('id', id)
      .select(`
        *,
        customers (name, phone)
      `)
      .single();

    if (error) throw error;
    return this.mapToDomain(updated);
  }

  async cancel(id: string): Promise<boolean> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_cancel_advance_booking', {
        p_booking_id: id,
      });

    if (error) {
      console.error('Error cancelling advance booking:', error);
      return false;
    }

    return (result as any)?.success === true;
  }

  async isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    duration: number,
    referenceTime?: string
  ): Promise<boolean> {
    const schedule = await this.getDaySchedule(machineId, date, referenceTime);
    const slotsNeeded = Math.ceil(duration / SLOT_DURATION_MINUTES);
    
    // Find the starting slot index
    const startIndex = schedule.timeSlots.findIndex(s => s.startTime === startTime);
    if (startIndex === -1) return false;
    
    // Check if all required slots are available
    for (let i = 0; i < slotsNeeded; i++) {
      const slotIndex = startIndex + i;
      if (slotIndex >= schedule.timeSlots.length) return false;
      if (schedule.timeSlots[slotIndex].status !== 'available') return false;
    }
    
    return true;
  }

  async getStats(): Promise<AdvanceBookingStats> {
    const { data, error } = await this.supabase
      .from('advance_bookings')
      .select('status');

    if (error || !data) {
      return {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
      };
    }

    return {
      totalBookings: data.length,
      pendingBookings: data.filter(b => b.status === 'pending').length,
      confirmedBookings: data.filter(b => b.status === 'confirmed').length,
      cancelledBookings: data.filter(b => b.status === 'cancelled').length,
      completedBookings: data.filter(b => b.status === 'completed').length,
    };
  }

  async logSession(bookingId: string, action: 'START' | 'STOP'): Promise<void> {
    const { error } = await this.supabase
      .rpc('rpc_log_booking_session', {
        p_booking_id: bookingId,
        p_action: action,
      });

    if (error) {
      console.error('Error logging session:', error);
      throw error;
    }
  }

  async getSessionLogs(bookingIds: string[]): Promise<BookingSessionLog[]> {
    if (bookingIds.length === 0) return [];

    const { data, error } = await this.supabase
      .rpc('rpc_get_booking_session_logs', {
        p_booking_ids: bookingIds,
      });

    if (error) {
      console.error('Error fetching session logs:', error);
      return [];
    }

    return (data as any[]).map(log => ({
      bookingId: log.booking_id,
      action: log.action as 'START' | 'STOP',
      recordedAt: log.recorded_at,
    }));
  }

  private generateTimeSlots(date: string, bookedSlots: Map<string, string>, referenceTime?: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    // If no reference time provided, don't mark any slots as passed
    const now = referenceTime ? dayjs(referenceTime) : null;
    const targetDate = dayjs(date);
    const isToday = now && now.isSame(targetDate, 'day');

    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute + SLOT_DURATION_MINUTES >= 60 ? hour + 1 : hour;
        const endMinute = (minute + SLOT_DURATION_MINUTES) % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        let status: TimeSlotStatus = 'available';
        let bookingId: string | undefined;
        
        // Check if slot has passed (for today)
        if (isToday && now) {
          const slotTime = dayjs(date).hour(hour).minute(minute).second(0).millisecond(0);
          if (slotTime.isBefore(now) && status === 'available') { // Only mark as passed if not already booked
            status = 'passed';
          }
        }

        // Check if slot is booked (overrides available/passed)
        if (bookedSlots.has(startTime)) {
          status = 'booked';
          bookingId = bookedSlots.get(startTime);
        }
        
        slots.push({
          id: `slot-${date}-${startTime}`,
          startTime,
          endTime,
          status,
          bookingId,
        });
      }
    }
    
    return slots;
  }

  private mapToDomain(raw: Database['public']['Tables']['advance_bookings']['Row'] & { 
    customers: { name: string; phone: string } | null 
  }): AdvanceBooking {
    const customer = raw.customers as unknown as { name: string; phone: string } | null;
    return {
      id: raw.id,
      machineId: raw.machine_id,
      customerId: raw.customer_id || undefined,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
      bookingDate: raw.booking_date,
      startTime: raw.start_time,
      endTime: raw.end_time,
      duration: raw.duration,
      status: raw.status as AdvanceBooking['status'],
      notes: raw.notes || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  }
}
