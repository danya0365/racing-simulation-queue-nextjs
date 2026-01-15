/**
 * BookingPresenter
 * Handles business logic for Booking page
 * Receives repositories via dependency injection
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

import {
  Booking,
  BookingDaySchedule,
  CreateBookingData,
  IBookingRepository,
} from '@/src/application/repositories/IBookingRepository';
import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { Metadata } from 'next';

import { SHOP_TIMEZONE } from '@/src/lib/date';

const DEFAULT_TIMEZONE = SHOP_TIMEZONE;


export interface BookingViewModel {
  machines: Machine[];
  selectedMachineId: string | null;
  selectedDate: string;
  availableDates: string[];
  timezone: string;
  daySchedule: BookingDaySchedule | null;
}

/**
 * Presenter for Booking page
 */
export class BookingPresenter {
  constructor(
    private readonly bookingRepo: IBookingRepository,
    private readonly machineRepo: IMachineRepository
  ) {}

  /**
   * Get initial view model for the page
   */
  async getViewModel(todayStr: string): Promise<BookingViewModel> {
    try {
      // Get machines and available dates in parallel
      const [machines, availableDates] = await Promise.all([
        this.machineRepo.getAll(),
        this.bookingRepo.getAvailableDates(todayStr, 7),
      ]);

      // Filter active machines only
      const activeMachines = machines.filter(m => m.isActive && m.status !== 'maintenance');
      const today = availableDates[0] || todayStr;

      return {
        machines: activeMachines,
        selectedMachineId: activeMachines.length > 0 ? activeMachines[0].id : null,
        selectedDate: today,
        availableDates,
        timezone: DEFAULT_TIMEZONE,
        daySchedule: null,
      };
    } catch (error) {
      console.error('Error getting view model:', error);
      throw error;
    }
  }

  /**
   * Get schedule for a specific day and machine
   * @param machineId - Machine UUID
   * @param date - Local date in YYYY-MM-DD format
   * @param referenceTime - ISO 8601 timestamp for marking passed slots (optional)
   * @param timezone - IANA timezone
   */
  async getDaySchedule(
    machineId: string, 
    date: string, 
    referenceTime: string,
    timezone: string = DEFAULT_TIMEZONE
  ): Promise<BookingDaySchedule> {
    return this.bookingRepo.getDaySchedule(machineId, date, timezone, referenceTime);
  }

  /**
   * Create a new booking
   * @param data - Booking data with local date/time
   * @param referenceTime - Current time for validation (unused for now but kept for API consistency)
   */
  async createBooking(data: CreateBookingData, referenceTime: string): Promise<Booking> {
    // Validate slot availability first
    const isAvailable = await this.bookingRepo.isSlotAvailable(
      data.machineId,
      data.localDate,
      data.localStartTime,
      data.durationMinutes,
      data.timezone || DEFAULT_TIMEZONE
    );

    if (!isAvailable) {
      throw new Error('ช่วงเวลานี้ไม่ว่าง กรุณาเลือกเวลาอื่น');
    }

    // Log referenceTime usage (for future validation if needed)
    console.log('Creating booking with referenceTime:', referenceTime);

    return this.bookingRepo.create(data);
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(id: string): Promise<boolean> {
    return this.bookingRepo.cancel(id);
  }

  /**
   * Check if a time slot is available
   */
  async isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
    timezone: string = DEFAULT_TIMEZONE
  ): Promise<boolean> {
    return this.bookingRepo.isSlotAvailable(machineId, date, startTime, durationMinutes, timezone);
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'จองเวลา | Racing Queue',
      description: 'จองคิวเครื่องเล่น Racing Simulator ล่วงหน้า เลือกวันและเวลาที่ต้องการได้ตามสะดวก',
    };
  }
}
