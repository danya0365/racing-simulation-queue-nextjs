/**
 * CustomerPresenter
 * Handles business logic for Customer booking page
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine, MachineStats } from '@/src/application/repositories/IMachineRepository';
import { CreateQueueData, IQueueRepository, Queue } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface MachineQueueInfo {
  machineId: string;
  waitingCount: number;
  playingCount: number;
  estimatedWaitMinutes: number;
  nextPosition: number;
}

export interface CustomerViewModel {
  machines: Machine[];
  availableMachines: Machine[];
  machineStats: MachineStats;
  userQueues: Queue[];
  machineQueueInfo: Record<string, MachineQueueInfo>;
}

export interface BookingFormData {
  machineId: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  notes?: string;
}

/**
 * Presenter for Customer page
 * ✅ Receives repositories via constructor injection
 */
export class CustomerPresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly queueRepository: IQueueRepository
  ) {}

  /**
   * Get view model for the customer page
   */
  async getViewModel(): Promise<CustomerViewModel> {
    try {
      const [machines, availableMachines, machineStats, allQueues] = await Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getAvailable(),
        this.machineRepository.getStats(),
        this.queueRepository.getAll(),
      ]);

      // Calculate queue info for each machine
      const machineQueueInfo: Record<string, MachineQueueInfo> = {};
      
      for (const machine of machines) {
        const machineQueues = allQueues.filter(q => q.machineId === machine.id);
        const waitingQueues = machineQueues.filter(q => q.status === 'waiting');
        const playingQueues = machineQueues.filter(q => q.status === 'playing');
        
        // Calculate estimated wait time (sum of remaining duration for playing + all waiting)
        let estimatedWaitMinutes = 0;
        for (const q of playingQueues) {
          estimatedWaitMinutes += q.duration; // Assume just started for simplicity
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
        machines,
        availableMachines,
        machineStats,
        userQueues: [],
        machineQueueInfo,
      };
    } catch (error) {
      console.error('Error getting customer view model:', error);
      throw error;
    }
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'จองคิว Racing Simulator | Racing Queue',
      description: 'จองคิวเครื่องเล่น Racing Simulator ง่ายๆ รวดเร็ว',
    };
  }

  /**
   * Get available machines
   */
  async getAvailableMachines(): Promise<Machine[]> {
    try {
      return await this.machineRepository.getAvailable();
    } catch (error) {
      console.error('Error getting available machines:', error);
      throw error;
    }
  }

  /**
   * Get machine by ID
   */
  async getMachineById(id: string): Promise<Machine | null> {
    try {
      return await this.machineRepository.getById(id);
    } catch (error) {
      console.error('Error getting machine:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(data: BookingFormData): Promise<Queue> {
    try {
      const createData: CreateQueueData = {
        machineId: data.machineId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        bookingTime: data.bookingTime,
        duration: data.duration,
        notes: data.notes,
      };

      const newQueue = await this.queueRepository.create(createData);

      return newQueue;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get queue by ID
   */
  async getQueueById(id: string): Promise<Queue | null> {
    try {
      return await this.queueRepository.getById(id);
    } catch (error) {
      console.error('Error getting queue:', error);
      throw error;
    }
  }

  /**
   * Get queues for a specific machine
   */
  async getQueuesByMachine(machineId: string): Promise<Queue[]> {
    try {
      return await this.queueRepository.getByMachineId(machineId);
    } catch (error) {
      console.error('Error getting machine queues:', error);
      throw error;
    }
  }

  /**
   * Cancel a queue booking
   */
  async cancelQueue(queueId: string): Promise<void> {
    try {
      await this.queueRepository.updateStatus(queueId, 'cancelled');
    } catch (error) {
      console.error('Error cancelling queue:', error);
      throw error;
    }
  }

  /**
   * Search queues by phone number
   */
  async searchQueuesByPhone(phone: string): Promise<Queue[]> {
    try {
      const allQueues = await this.queueRepository.getAll();
      // Normalize phone number for comparison (remove dashes, spaces)
      const normalizedPhone = phone.replace(/[-\s]/g, '');
      return allQueues.filter(q => 
        q.customerPhone.replace(/[-\s]/g, '').includes(normalizedPhone)
      );
    } catch (error) {
      console.error('Error searching queues by phone:', error);
      throw error;
    }
  }

  /**
   * Search queue by ID or position
   */
  async searchQueueById(searchTerm: string): Promise<Queue | null> {
    try {
      // Try searching by exact ID first
      const queue = await this.queueRepository.getById(searchTerm);
      if (queue) return queue;

      // If not found, try searching by position number
      const allQueues = await this.queueRepository.getAll();
      const position = parseInt(searchTerm.replace('#', ''), 10);
      if (!isNaN(position)) {
        return allQueues.find(q => q.position === position) || null;
      }

      return null;
    } catch (error) {
      console.error('Error searching queue by ID:', error);
      throw error;
    }
  }

  /**
   * Get all queues (for history)
   */
  async getAllQueues(): Promise<Queue[]> {
    try {
      return await this.queueRepository.getAll();
    } catch (error) {
      console.error('Error getting all queues:', error);
      throw error;
    }
  }
}
