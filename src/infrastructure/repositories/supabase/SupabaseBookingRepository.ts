/**
 * SupabaseBookingRepository
 * Implementation of IBookingRepository using Supabase
 * Following Clean Architecture - Infrastructure layer
 * 
 * Key features:
 * - Full TIMESTAMPTZ support for timezone-aware bookings
 * - Cross-midnight booking handling
 * - Generated column queries for fast local-time lookups
 * - Uses generated Supabase types for type safety
 */

import {
  Booking,
  BookingDaySchedule,
  BookingLog,
  BookingSlotStatus,
  BookingStats,
  BookingTimeSlot,
  CreateBookingData,
  IBookingRepository,
  UpdateBookingData,
} from '@/src/application/repositories/IBookingRepository';
import { OPERATING_HOURS } from '@/src/config/booking.config';
import { Database } from '@/src/domain/types/supabase';
import { SHOP_TIMEZONE } from '@/src/lib/date';
import { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

// Table types from generated Supabase types
type BookingRow = Database['public']['Tables']['bookings']['Row'];

// RPC return types from generated Supabase types
type RpcGetBookingsScheduleResult = Database['public']['Functions']['rpc_get_bookings_schedule']['Returns'][number];
type RpcGetMyBookingsResult = Database['public']['Functions']['rpc_get_my_bookings']['Returns'][number];
type RpcGetBookingsByMachineDateResult = Database['public']['Functions']['rpc_get_bookings_by_machine_date']['Returns'][number];
type RpcGetBookingLogsResult = Database['public']['Functions']['rpc_get_booking_logs']['Returns'][number];

// Operating hours configuration
const OPENING_HOUR = OPERATING_HOURS.isOpen24Hours ? 0 : OPERATING_HOURS.open;
const CLOSING_HOUR = OPERATING_HOURS.isOpen24Hours ? 24 : OPERATING_HOURS.close;
const SLOT_DURATION_MINUTES = OPERATING_HOURS.slotDurationMinutes;

export class SupabaseBookingRepository implements IBookingRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getDaySchedule(
    machineId: string, 
    date: string, 
    tz: string = SHOP_TIMEZONE,
    referenceTime?: string,
    customerId?: string
  ): Promise<BookingDaySchedule> {
    // Get bookings for this date from RPC (includes cross-midnight bookings)
    const { data: bookings, error } = await this.client
      .rpc('rpc_get_bookings_schedule', {
        p_machine_id: machineId,
        p_date: date,
        p_timezone: tz,
        p_customer_id: customerId,
      });

    if (error) {
      console.error('Error fetching bookings schedule:', error);
    }

    // Create a map of booked time slots
    const bookedSlots = new Map<string, { bookingId: string; isCrossMidnight: boolean }>();
    
    if (bookings) {
      bookings.forEach((booking) => {
        // Convert start/end times to dayjs for processing
        const bookingStartAt = dayjs(booking.start_at).tz(tz);
        const bookingEndAt = dayjs(booking.end_at).tz(tz);
        const targetDate = dayjs(date);
        
        // Determine which slots to mark for THIS date's schedule
        let slotStart: dayjs.Dayjs;
        let slotEnd: dayjs.Dayjs;

        if (booking.is_cross_midnight) {
          // Cross-midnight booking handling
          const bookingStartDate = bookingStartAt.format('YYYY-MM-DD');
          const bookingEndDate = bookingEndAt.format('YYYY-MM-DD');
          
          if (targetDate.format('YYYY-MM-DD') === bookingStartDate) {
            // Target date is the START date: show slots from start_time to midnight
            slotStart = bookingStartAt;
            slotEnd = bookingStartAt.endOf('day');
          } else if (targetDate.format('YYYY-MM-DD') === bookingEndDate) {
            // Target date is the END date: show slots from midnight to end_time
            slotStart = bookingEndAt.startOf('day');
            slotEnd = bookingEndAt;
          } else {
            // Target date is neither start nor end date (shouldn't happen with our query)
            return;
          }
        } else {
          // Normal booking: use local times directly
          slotStart = bookingStartAt;
          slotEnd = bookingEndAt;
        }

        // Align start time to nearest slot boundary (round down)
        // This ensures sessions starting at uneven times (e.g., 14:15) correctly block the 14:00 and 14:30 slots
        const startMinute = slotStart.minute();
        const startRemainder = startMinute % SLOT_DURATION_MINUTES;
        const alignedStart = slotStart.subtract(startRemainder, 'minute').startOf('minute');
        
        // Mark all slots covered by this booking
        let current = alignedStart;
        while (current.isBefore(slotEnd)) {
          const timeKey = current.format('HH:mm');
          // Only set if not already booked (or priority logic if needed, but simplistic is fine for now)
          if (!bookedSlots.has(timeKey)) {
            bookedSlots.set(timeKey, { 
              bookingId: booking.booking_id,
              isCrossMidnight: booking.is_cross_midnight
            });
          }
          current = current.add(SLOT_DURATION_MINUTES, 'minute');
        }
      });
    }

    const timeSlots = this.generateTimeSlots(date, bookedSlots, tz, referenceTime);
    const availableCount = timeSlots.filter(s => s.status === 'available').length;
    const bookedCount = timeSlots.filter(s => s.bookingId !== undefined).length;

    return {
      date,
      machineId,
      timezone: tz,
      timeSlots,
      totalSlots: timeSlots.length,
      availableSlots: availableCount,
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

  async getById(id: string): Promise<Booking | null> {
    const { data, error } = await this.client
      .from('bookings')
      .select(`
        *,
        customers (name, phone)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getMyBookings(customerId: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .rpc('rpc_get_my_bookings', {
        p_customer_id: customerId,
      });

    if (error || !data) {
      console.error('Error fetching my bookings:', error);
      return [];
    }

    return data.map(row => ({
      id: row.booking_id,
      machineId: row.machine_id,
      machineName: row.machine_name,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      startAt: row.start_at,
      endAt: row.end_at,
      durationMinutes: row.duration_minutes,
      businessTimezone: row.business_timezone,
      localDate: row.local_date,
      localStartTime: row.local_start_time,
      localEndTime: row.local_end_time,
      isCrossMidnight: row.is_cross_midnight,
      status: row.status as Booking['status'],
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
  }

  async getByMachineAndDate(machineId: string, date: string, customerId?: string): Promise<Booking[]> {
    const { data, error } = await this.client
      .rpc('rpc_get_bookings_by_machine_date', {
        p_machine_id: machineId,
        p_date: date,
        p_customer_id: customerId,
      });

    if (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }

    return (data as RpcGetBookingsByMachineDateResult[]).map(row => ({
      id: row.booking_id,
      machineId: row.machine_id,
      customerId: undefined, // RPC doesn't return ID for privacy, but we know is_owner
      isOwner: row.is_owner,
      customerName: row.customer_name,
      customerPhone: row.customer_phone || '', // Will be NULL/empty if not owner/admin
      startAt: row.start_at,
      endAt: row.end_at,
      durationMinutes: row.duration_minutes,
      businessTimezone: row.business_timezone,
      localDate: row.local_date,
      localStartTime: row.local_start_time,
      localEndTime: row.local_end_time,
      isCrossMidnight: row.is_cross_midnight,
      status: row.status as Booking['status'],
      createdAt: row.created_at,
      updatedAt: row.created_at,
    }));
  }

  async create(data: CreateBookingData): Promise<Booking> {
    const tz = data.timezone || SHOP_TIMEZONE;
    
    const { data: result, error } = await this.client
      .rpc('rpc_create_booking', {
        p_machine_id: data.machineId,
        p_customer_name: data.customerName,
        p_customer_phone: data.customerPhone,
        p_local_date: data.localDate,
        p_local_start_time: data.localStartTime,
        p_duration_minutes: data.durationMinutes,
        p_timezone: tz,
        p_notes: data.notes,
        p_customer_id: data.customerId || undefined,
      });

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error('เกิดข้อผิดพลาดในการสร้างการจอง');
    }

    const rpcResult = result as {
      success: boolean;
      error?: string;
      booking?: {
        id: string;
        machineId: string;
        customerId: string;
        customerName: string;
        customerPhone: string;
        startAt: string;
        endAt: string;
        localDate: string;
        localStartTime: string;
        localEndTime: string;
        durationMinutes: number;
        businessTimezone: string;
        isCrossMidnight: boolean;
        status: string;
        createdAt: string;
      };
    };

    if (!rpcResult.success) {
      throw new Error(rpcResult.error || 'เกิดข้อผิดพลาดในการสร้างการจอง');
    }

    const booking = rpcResult.booking!;
    return {
      id: booking.id,
      machineId: booking.machineId,
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      startAt: booking.startAt,
      endAt: booking.endAt,
      durationMinutes: booking.durationMinutes,
      businessTimezone: booking.businessTimezone,
      localDate: booking.localDate,
      localStartTime: booking.localStartTime,
      localEndTime: booking.localEndTime,
      isCrossMidnight: booking.isCrossMidnight,
      status: booking.status as Booking['status'],
      createdAt: booking.createdAt,
      updatedAt: booking.createdAt,
    };
  }

  async update(id: string, data: UpdateBookingData): Promise<Booking> {
    const { data: updated, error } = await this.client
      .from('bookings')
      .update({
        status: data.status,
        notes: data.notes,
        updated_at: dayjs().toISOString(),
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

  async cancel(id: string, customerId: string): Promise<boolean> {
    const { data: result, error } = await this.client
      .rpc('rpc_cancel_booking', {
        p_booking_id: id,
        p_customer_id: customerId || undefined,
      });

    if (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }

    return (result as { success: boolean })?.success === true;
  }

  async isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    tz: string = SHOP_TIMEZONE,
  ): Promise<boolean> {
    const { data, error } = await this.client
      .rpc('rpc_is_booking_slot_available', {
        p_machine_id: machineId,
        p_local_date: date,
        p_local_start_time: startTime,
        p_duration_minutes: durationMinutes,
        p_timezone: tz,
      });

    if (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }

    return data === true;
  }

  async getStats(): Promise<BookingStats> {
    const { data, error } = await this.client
      .rpc('rpc_get_booking_stats');

    if (error || !data) {
      console.error('Error fetching booking stats:', error);
      return {
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        seatedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
      };
    }

    // Cast the JSON result to BookingStats (Supabase RPC returns JSON as any/object)
    const stats = data as unknown as BookingStats;

    return {
      totalBookings: stats.totalBookings || 0,
      pendingBookings: stats.pendingBookings || 0,
      confirmedBookings: stats.confirmedBookings || 0,
      seatedBookings: stats.seatedBookings || 0,
      cancelledBookings: stats.cancelledBookings || 0,
      completedBookings: stats.completedBookings || 0,
    };
  }

  async logSession(bookingId: string, action: 'START' | 'STOP'): Promise<void> {
    const { error } = await this.client
      .rpc('rpc_log_booking', {
        p_booking_id: bookingId,
        p_action: action,
      });

    if (error) {
      console.error('Error logging session:', error);
      throw error;
    }
  }

  async getSessionLogs(bookingIds: string[]): Promise<BookingLog[]> {
    if (bookingIds.length === 0) return [];

    const { data, error } = await this.client
      .rpc('rpc_get_booking_logs', {
        p_booking_ids: bookingIds,
      });

    if (error) {
      console.error('Error fetching session logs:', error);
      return [];
    }

    return data.map(log => ({
      bookingId: log.booking_id,
      action: log.action as 'START' | 'STOP',
      recordedAt: log.recorded_at,
    }));
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  private generateTimeSlots(
    date: string, 
    bookedSlots: Map<string, { bookingId: string; isCrossMidnight: boolean }>,
    tz: string,
    referenceTime?: string
  ): BookingTimeSlot[] {
    const slots: BookingTimeSlot[] = [];
    
    // Reference time for marking passed slots
    const now = referenceTime ? dayjs(referenceTime).tz(tz) : null;
    const targetDate = dayjs(date).tz(tz);
    const isToday = now && now.isSame(targetDate, 'day');

    for (let hour = OPENING_HOUR; hour < CLOSING_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_DURATION_MINUTES) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endHour = minute + SLOT_DURATION_MINUTES >= 60 ? hour + 1 : hour;
        const endMinute = (minute + SLOT_DURATION_MINUTES) % 60;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        
        let status: BookingSlotStatus = 'available';
        let bookingId: string | undefined;
        let isCrossMidnight = false;
        
        // Check if slot has passed (for today)
        if (isToday && now) {
          const slotTime = targetDate.hour(hour).minute(minute).second(0).millisecond(0);
          if (slotTime.isBefore(now)) {
            status = 'passed';
          }
        }

        // Check if slot is booked (overrides available/passed)
        const bookedInfo = bookedSlots.get(startTime);
        if (bookedInfo) {
          status = 'booked';
          bookingId = bookedInfo.bookingId;
          isCrossMidnight = bookedInfo.isCrossMidnight;
        }
        
        slots.push({
          id: `slot-${date}-${startTime}`,
          startTime,
          endTime,
          status,
          bookingId,
          isCrossMidnight,
        });
      }
    }
    
    return slots;
  }

  /**
   * Map database row to domain model (Booking)
   * Handles both direct table queries and joined customer data
   */
  private mapToDomain = (raw: BookingRow & { customers?: { name: string; phone: string } | null }): Booking => {
    return {
      id: raw.id,
      machineId: raw.machine_id,
      customerId: raw.customer_id,
      customerName: raw.customers?.name || '',
      customerPhone: raw.customers?.phone || '',
      startAt: raw.start_at,
      endAt: raw.end_at,
      durationMinutes: raw.duration_minutes,
      businessTimezone: raw.business_timezone,
      localDate: raw.local_date || '',
      localStartTime: raw.local_start_time || '',
      localEndTime: raw.local_end_time || '',
      isCrossMidnight: raw.is_cross_midnight || false,
      status: raw.status as Booking['status'],
      notes: raw.notes || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  };
}
