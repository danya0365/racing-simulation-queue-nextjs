/**
 * BookingWizardPresenter
 * Handles business logic for the Booking Wizard
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue } from '@/src/application/repositories/IQueueRepository';
import { MachineQueueInfo } from '../customer/CustomerPresenter';

export interface BookingFormData {
  customerPhone: string;
  customerName: string;
  machineId: string;
  machineName: string;
  duration: number;
  estimatedWait: number;
  queuePosition: number;
}

export interface BookingWizardViewModel {
  machines: Machine[];
  machineQueueInfo: Record<string, MachineQueueInfo>;
}

/**
 * Presenter for Booking Wizard
 */
export class BookingWizardPresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly queueRepository: IQueueRepository
  ) {}

  /**
   * Get view model for the booking wizard
   */
  async getViewModel(): Promise<BookingWizardViewModel> {
    try {
      const [machines, allQueues] = await Promise.all([
        this.machineRepository.getAll(),
        this.queueRepository.getAll(),
      ]);

      // Calculate queue info for each machine
      const machineQueueInfo: Record<string, MachineQueueInfo> = {};
      
      for (const machine of machines) {
        const machineQueues = allQueues.filter(q => q.machineId === machine.id);
        const waitingQueues = machineQueues.filter(q => q.status === 'waiting');
        const playingQueues = machineQueues.filter(q => q.status === 'playing');
        
        let estimatedWaitMinutes = 0;
        for (const q of playingQueues) {
          estimatedWaitMinutes += q.duration;
        }
        for (const q of waitingQueues) {
          estimatedWaitMinutes += q.duration;
        }

        machineQueueInfo[machine.id] = {
          machineId: machine.id,
          waitingCount: waitingQueues.length,
          playingCount: playingQueues.length,
          estimatedWaitMinutes,
          nextPosition: waitingQueues.length + playingQueues.length + 1,
        };
      }

      return {
        machines: machines.filter(m => m.isActive && m.status !== 'maintenance'),
        machineQueueInfo,
      };
    } catch (error) {
      console.error('Error getting booking wizard view model:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(data: {
    machineId: string;
    customerName: string;
    customerPhone: string;
    bookingTime: string;
    duration: number;
  }): Promise<Queue> {
    try {
      return await this.queueRepository.create(data);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }
}
