/**
 * QueueStatusPresenter
 * Handles business logic for Queue Status page
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface QueueStatusData {
  id: string;
  machineId: string;
  machineName: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  position: number;
  queueAhead: number;
}

export interface QueueStatusViewModel {
  queues: QueueStatusData[];
  waitingQueues: QueueStatusData[];
  playingQueues: QueueStatusData[];
  completedQueues: QueueStatusData[];
}

/**
 * Presenter for Queue Status page
 * ✅ Receives repository via constructor injection (not Supabase directly)
 */
export class QueueStatusPresenter {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly machineRepository: IMachineRepository
  ) {}

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'สถานะคิวของฉัน | Racing Queue',
      description: 'ดูสถานะคิวที่คุณจองไว้ทั้งหมด ติดตามลำดับคิวแบบ Real-time',
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
   * Calculate queue ahead for a specific queue
   */
  async calculateQueueAhead(queue: Queue): Promise<number> {
    try {
      const allQueues = await this.queueRepository.getAll();
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
   * Load queue status data for multiple queue IDs
   */
  async loadQueueStatusData(queueIds: string[]): Promise<QueueStatusData[]> {
    const results: QueueStatusData[] = [];

    for (const queueId of queueIds) {
      try {
        const queue = await this.getQueueById(queueId);
        if (!queue) continue;

        const machine = await this.getMachineById(queue.machineId);
        const queueAhead = await this.calculateQueueAhead(queue);

        results.push({
          id: queue.id,
          machineId: queue.machineId,
          machineName: machine?.name || 'Unknown',
          customerName: queue.customerName,
          customerPhone: queue.customerPhone,
          bookingTime: queue.bookingTime,
          duration: queue.duration,
          status: queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
          position: queue.position,
          queueAhead,
        });
      } catch (error) {
        console.error(`Error loading queue ${queueId}:`, error);
      }
    }

    return results;
  }

  /**
   * Get view model from queue status data
   */
  getViewModel(queues: QueueStatusData[]): QueueStatusViewModel {
    return {
      queues,
      waitingQueues: queues.filter(q => q.status === 'waiting'),
      playingQueues: queues.filter(q => q.status === 'playing'),
      completedQueues: queues.filter(q => q.status === 'completed' || q.status === 'cancelled'),
    };
  }
}
