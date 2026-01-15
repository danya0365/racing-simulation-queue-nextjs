/**
 * TimeBookingPresenter
 * Handles business logic for Time Booking
 * Receives repository via dependency injection
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */

import { Booking, BookingDaySchedule, CreateBookingData, IBookingRepository } from '@/src/application/repositories/IBookingRepository';
import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';

import { SHOP_TIMEZONE } from '@/src/lib/date';



export interface TimeBookingViewModel {
  machines: Machine[];
  schedule: BookingDaySchedule | null;
  loading: boolean;
  timezone: string;
}

/**
 * Presenter for QuickTimeBooking
 * ✅ Receives repositories via constructor injection (not Supabase directly)
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based)
 */
export class TimeBookingPresenter {
  constructor(
    private readonly bookingRepository: IBookingRepository,
    private readonly machineRepository: IMachineRepository
  ) {}

  /**
   * Get initial view model with machines
   */
  async getViewModel(): Promise<TimeBookingViewModel> {
    try {
      const allMachines = await this.machineRepository.getAll();
      const activeMachines = allMachines.filter(m => m.isActive);

      return {
        machines: activeMachines,
        schedule: null,
        loading: false,
        timezone: SHOP_TIMEZONE,
      };
    } catch (error) {
      console.error('Error getting view model:', error);
      throw error;
    }
  }

  /**
   * Get all active machines
   */
  async getMachines(): Promise<Machine[]> {
    try {
      const allMachines = await this.machineRepository.getAll();
      return allMachines.filter(m => m.isActive);
    } catch (error) {
      console.error('Error getting machines:', error);
      throw error;
    }
  }

  /**
   * Get schedule for a specific machine and date
   * @param machineId - Machine UUID
   * @param date - Local date in YYYY-MM-DD format
   * @param referenceTime - ISO 8601 timestamp for marking passed slots
   * @param timezone - IANA timezone
   */
  async getDaySchedule(
    machineId: string, 
    date: string, 
    referenceTime: string,
    timezone: string = SHOP_TIMEZONE
  ): Promise<BookingDaySchedule> {
    try {
      return await this.bookingRepository.getDaySchedule(machineId, date, timezone, referenceTime);
    } catch (error) {
      console.error('Error getting day schedule:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   * @param data - CreateBookingData with localDate, localStartTime, durationMinutes, timezone
   */
  async createBooking(data: CreateBookingData): Promise<Booking> {
    try {
      return await this.bookingRepository.create(data);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }
}
