/**
 * BackendPresenter
 * Handles business logic for Admin/Backend page
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine, MachineStats, MachineStatus } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue, QueueStats, QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface BackendViewModel {
  machines: Machine[];
  machineStats: MachineStats;
  queues: Queue[];
  queueStats: QueueStats;
  /** Active queues (waiting/playing) + recently finished (24h) - for 24-hour operations */
  activeQueues: Queue[];
  waitingQueues: Queue[];
}

/**
 * Presenter for Backend/Admin page
 */
export class BackendPresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly queueRepository: IQueueRepository
  ) {}

  /**
   * Get view model for the backend page
   */
  async getViewModel(): Promise<BackendViewModel> {
    try {
      const [machines, machineStats, queues, queueStats, activeQueues, waitingQueues] = await Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getStats(),
        this.queueRepository.getAll(),
        this.queueRepository.getStats(),
        this.queueRepository.getActiveAndRecent(),
        this.queueRepository.getWaiting(),
      ]);

      return {
        machines,
        machineStats,
        queues,
        queueStats,
        activeQueues,
        waitingQueues,
      };
    } catch (error) {
      console.error('Error getting backend view model:', error);
      throw error;
    }
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'แอดมิน | Racing Queue',
      description: 'ระบบจัดการคิวและเครื่องเล่น Racing Simulator',
    };
  }

  /**
   * Update queue status
   */
  async updateQueueStatus(queueId: string, status: QueueStatus): Promise<Queue> {
    try {
      return await this.queueRepository.updateStatus(queueId, status);
    } catch (error) {
      console.error('Error updating queue status:', error);
      throw error;
    }
  }

  /**
   * Update machine status
   */
  async updateMachineStatus(machineId: string, status: MachineStatus): Promise<Machine> {
    try {
      return await this.machineRepository.updateStatus(machineId, status);
    } catch (error) {
      console.error('Error updating machine status:', error);
      throw error;
    }
  }

  /**
   * Delete a queue
   */
  async deleteQueue(queueId: string): Promise<boolean> {
    try {
      return await this.queueRepository.delete(queueId);
    } catch (error) {
      console.error('Error deleting queue:', error);
      throw error;
    }
  }

  /**
   * Get all queues
   */
  async getAllQueues(): Promise<Queue[]> {
    try {
      return await this.queueRepository.getAll();
    } catch (error) {
      console.error('Error getting all queues:', error);
      throw error;
    }
  }

  /**
   * Get queues by machine
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
   * Reset all queues for a machine
   */
  async resetMachineQueue(machineId: string): Promise<{ cancelledCount: number; completedCount: number }> {
    try {
      return await this.queueRepository.resetMachineQueue(machineId);
    } catch (error) {
      console.error('Error resetting machine queue:', error);
      throw error;
    }
  }

  /**
   * Update machine details (name, description, position, isActive, status, etc.)
   */
  async updateMachine(machineId: string, data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }): Promise<Machine> {
    try {
      return await this.machineRepository.update(machineId, data);
    } catch (error) {
      console.error('Error updating machine:', error);
      throw error;
    }
  }
}
