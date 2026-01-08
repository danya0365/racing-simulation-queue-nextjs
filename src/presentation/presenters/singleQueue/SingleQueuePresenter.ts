/**
 * SingleQueuePresenter
 * Handles business logic for viewing a single queue status
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface SingleQueueViewModel {
  queue: Queue | null;
  machine: Machine | null;
  queueAhead: number;
}

/**
 * Presenter for Single Queue Status page
 * ✅ Receives repository via constructor injection
 */
export class SingleQueuePresenter {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly machineRepository: IMachineRepository
  ) {}

  /**
   * Generate metadata for the page
   */
  generateMetadata(queueId: string): Metadata {
    return {
      title: `สถานะคิว ${queueId} | Racing Queue`,
      description: 'ดูสถานะและตำแหน่งคิวของคุณแบบ Real-time',
    };
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
   * Get all queues (for calculating queue ahead)
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
   * Calculate queue ahead for a specific queue
   */
  async calculateQueueAhead(queue: Queue): Promise<number> {
    try {
      const allQueues = await this.getAllQueues();
      const machineQueues = allQueues.filter(
        q => q.machineId === queue.machineId && 
        q.status === 'waiting' && 
        q.position < queue.position
      );
      return machineQueues.length;
    } catch {
      return Math.max(0, queue.position - 1);
    }
  }

  /**
   * Cancel a queue
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
   * Get full view model for a queue
   */
  async getViewModel(queueId: string): Promise<SingleQueueViewModel> {
    const queue = await this.getQueueById(queueId);
    
    if (!queue) {
      return { queue: null, machine: null, queueAhead: 0 };
    }

    const machine = await this.getMachineById(queue.machineId);
    const queueAhead = await this.calculateQueueAhead(queue);

    return {
      queue,
      machine,
      queueAhead,
    };
  }
}
