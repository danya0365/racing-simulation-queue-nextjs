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
  todayQueues: Queue[];
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
      const [machines, machineStats, queues, queueStats, todayQueues, waitingQueues] = await Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getStats(),
        this.queueRepository.getAll(),
        this.queueRepository.getStats(),
        this.queueRepository.getToday(),
        this.queueRepository.getWaiting(),
      ]);

      return {
        machines,
        machineStats,
        queues,
        queueStats,
        todayQueues,
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
}
