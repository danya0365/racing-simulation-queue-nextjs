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
  customerId?: string;
  machineName: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  position: number;
  queueAhead: number;
  /** Estimated wait time in minutes - sum of durations from playing + waiting queues ahead */
  estimatedWaitMinutes: number;
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
   * Calculate queue ahead count and estimated wait time for a specific queue
   * Returns { queueAhead, estimatedWaitMinutes }
   */
  async calculateQueueAhead(queue: Queue): Promise<{ queueAhead: number; estimatedWaitMinutes: number }> {
    try {
      const allQueues = await this.queueRepository.getAll();
      const machineQueues = allQueues.filter(q => q.machineId === queue.machineId);
      
      // Get waiting queues ahead (lower position = ahead)
      const waitingAhead = machineQueues.filter(
        q => q.status === 'waiting' && q.position < queue.position
      );
      
      // Get playing queue (if any)
      const playingQueue = machineQueues.find(q => q.status === 'playing');
      
      // Calculate estimated wait time
      let estimatedWaitMinutes = 0;
      
      // Add playing queue duration (assume just started for simplicity)
      if (playingQueue) {
        estimatedWaitMinutes += playingQueue.duration;
      }
      
      // Add all waiting queues ahead
      for (const q of waitingAhead) {
        estimatedWaitMinutes += q.duration;
      }
      
      return {
        queueAhead: waitingAhead.length + (playingQueue ? 1 : 0),
        estimatedWaitMinutes
      };
    } catch {
      return { 
        queueAhead: Math.max(0, queue.position - 1), 
        estimatedWaitMinutes: Math.max(0, queue.position - 1) * 30 // Fallback: 30 min per queue
      };
    }
  }

  /**
   * Cancel a queue
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
   * Load queue status data for multiple queue IDs
   */
  async loadQueueStatusData(queueIds: string[]): Promise<QueueStatusData[]> {
    const results: QueueStatusData[] = [];

    for (const queueId of queueIds) {
      try {
        const queue = await this.getQueueById(queueId);
        if (!queue) continue;

        const machine = await this.getMachineById(queue.machineId);
        const { queueAhead, estimatedWaitMinutes } = await this.calculateQueueAhead(queue);

        results.push({
          id: queue.id,
          machineId: queue.machineId,
          customerId: queue.customerId,
          machineName: machine?.name || 'Unknown',
          customerName: queue.customerName,
          customerPhone: queue.customerPhone,
          bookingTime: queue.bookingTime,
          duration: queue.duration,
          status: queue.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
          position: queue.position,
          queueAhead,
          estimatedWaitMinutes,
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
