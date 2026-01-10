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
   * Helper to wrap promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 15000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out (${ms}ms)`)), ms)
      )
    ]);
  }

  /**
   * Get view model for the customer page
   */
  async getViewModel(): Promise<CustomerViewModel> {
    try {
      const [machines, availableMachines, machineStats, dashboardInfo] = await this.withTimeout(Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getAvailable(),
        this.machineRepository.getStats(),
        this.machineRepository.getDashboardInfo(),
      ]));

      // Map dashboard info to dictionary
      const machineQueueInfo: Record<string, MachineQueueInfo> = {};
      
      // Default info for machines with no activity
      machines.forEach(m => {
        machineQueueInfo[m.id] = {
          machineId: m.id,
          waitingCount: 0,
          playingCount: 0,
          estimatedWaitMinutes: 0,
          nextPosition: 1,
        };
      });

      // Update with actual data from RPC
      dashboardInfo.forEach(info => {
        machineQueueInfo[info.machineId] = {
          machineId: info.machineId,
          waitingCount: info.waitingCount,
          playingCount: info.playingCount,
          estimatedWaitMinutes: info.estimatedWaitMinutes,
          nextPosition: info.nextPosition,
        };
      });

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
  async cancelQueue(queueId: string, customerId?: string): Promise<void> {
    try {
      await this.queueRepository.cancel(queueId, customerId);
    } catch (error) {
      console.error('Error cancelling queue:', error);
      throw error;
    }
  }

  /**
   * Search queues by phone number (Optimized via RPC)
   */
  async searchQueuesByPhone(phone: string): Promise<Queue[]> {
    try {
      return await this.queueRepository.searchByPhone(phone);
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
