/**
 * CustomerPresenter
 * Handles business logic for Customer booking page
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine, MachineStats } from '@/src/application/repositories/IMachineRepository';
import { CreateQueueData, IQueueRepository, Queue } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface CustomerViewModel {
  machines: Machine[];
  availableMachines: Machine[];
  machineStats: MachineStats;
  userQueues: Queue[];
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
      const [machines, availableMachines, machineStats] = await Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getAvailable(),
        this.machineRepository.getStats(),
      ]);

      return {
        machines,
        availableMachines,
        machineStats,
        userQueues: [], // Will be populated when user auth is implemented
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
}
