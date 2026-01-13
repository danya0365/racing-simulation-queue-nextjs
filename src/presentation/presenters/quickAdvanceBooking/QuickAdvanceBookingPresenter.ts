/**
 * QuickAdvanceBookingPresenter
 * Handles business logic for Quick Advance Booking
 * Receives repository via dependency injection
 */

import { AdvanceBooking, CreateAdvanceBookingData, DaySchedule, IAdvanceBookingRepository } from '@/src/application/repositories/IAdvanceBookingRepository';
import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';

export interface QuickAdvanceBookingViewModel {
  machines: Machine[];
  schedule: DaySchedule | null;
  loading: boolean;
}

/**
 * Presenter for QuickAdvanceBooking
 * ✅ Receives repositories via constructor injection (not Supabase directly)
 */
export class QuickAdvanceBookingPresenter {
  constructor(
    private readonly advanceBookingRepository: IAdvanceBookingRepository,
    private readonly machineRepository: IMachineRepository
  ) {}

  /**
   * Get initial view model with machines
   */
  async getViewModel(): Promise<QuickAdvanceBookingViewModel> {
    try {
      const allMachines = await this.machineRepository.getAll();
      const activeMachines = allMachines.filter(m => m.isActive);

      return {
        machines: activeMachines,
        schedule: null,
        loading: false,
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
   */
  async getDaySchedule(machineId: string, date: string, nowStr: string): Promise<DaySchedule> {
    try {
      return await this.advanceBookingRepository.getDaySchedule(machineId, date, nowStr);
    } catch (error) {
      console.error('Error getting day schedule:', error);
      throw error;
    }
  }

  /**
   * Create a new advance booking
   */
  async createBooking(data: CreateAdvanceBookingData): Promise<AdvanceBooking> {
    try {
      return await this.advanceBookingRepository.create(data);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }
}
