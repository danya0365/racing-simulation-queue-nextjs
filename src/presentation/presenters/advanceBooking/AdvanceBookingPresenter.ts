/**
 * AdvanceBookingPresenter
 * Handles business logic for Advance Booking page
 * Receives repositories via dependency injection
 */

import {
    AdvanceBooking,
    CreateAdvanceBookingData,
    DaySchedule,
    IAdvanceBookingRepository,
} from '@/src/application/repositories/IAdvanceBookingRepository';
import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { Metadata } from 'next';

export interface AdvanceBookingViewModel {
  machines: Machine[];
  selectedMachineId: string | null;
  selectedDate: string;
  availableDates: string[];
  daySchedule: DaySchedule | null;
}

/**
 * Presenter for Advance Booking page
 */
export class AdvanceBookingPresenter {
  constructor(
    private readonly advanceBookingRepo: IAdvanceBookingRepository,
    private readonly machineRepo: IMachineRepository
  ) {}

  /**
   * Get initial view model for the page
   */
  async getViewModel(todayStr: string): Promise<AdvanceBookingViewModel> {
    try {
      // Get machines and available dates in parallel
      const [machines, availableDates] = await Promise.all([
        this.machineRepo.getAll(),
        this.advanceBookingRepo.getAvailableDates(todayStr, 7),
      ]);

      // Filter active machines only
      const activeMachines = machines.filter(m => m.isActive && m.status !== 'maintenance');
      const today = availableDates[0] || todayStr;

      return {
        machines: activeMachines,
        selectedMachineId: activeMachines.length > 0 ? activeMachines[0].id : null,
        selectedDate: today,
        availableDates,
        daySchedule: null,
      };
    } catch (error) {
      console.error('Error getting view model:', error);
      throw error;
    }
  }

  /**
   * Get schedule for a specific day and machine
   */
  async getDaySchedule(machineId: string, date: string, now: string): Promise<DaySchedule> {
    return this.advanceBookingRepo.getDaySchedule(machineId, date, now);
  }

  /**
   * Create a new advance booking
   */
  async createBooking(data: CreateAdvanceBookingData, now: string): Promise<AdvanceBooking> {
    // Validate slot availability first
    const isAvailable = await this.advanceBookingRepo.isSlotAvailable(
      data.machineId,
      data.bookingDate,
      data.startTime,
      data.duration,
      now
    );

    if (!isAvailable) {
      throw new Error('ช่วงเวลานี้ไม่ว่าง กรุณาเลือกเวลาอื่น');
    }

    return this.advanceBookingRepo.create(data);
  }

  /**
   * Cancel an advance booking
   */
  async cancelBooking(id: string): Promise<boolean> {
    return this.advanceBookingRepo.cancel(id);
  }

  /**
   * Check if a time slot is available
   */
  async isSlotAvailable(
    machineId: string,
    date: string,
    startTime: string,
    duration: number,
    now: string
  ): Promise<boolean> {
    return this.advanceBookingRepo.isSlotAvailable(machineId, date, startTime, duration, now);
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'จองคิวล่วงหน้า | Racing Queue',
      description: 'จองคิวเครื่องเล่น Racing Simulator ล่วงหน้า เลือกวันและเวลาที่ต้องการได้ตามสะดวก',
    };
  }
}
