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
      throw error;
    }
  }

  /**
   * Calculate queue ahead count and estimated wait time for a specific queue
   * Returns { queueAhead, estimatedWaitMinutes }
   */
  async calculateQueueAhead(queue: Queue): Promise<{ queueAhead: number; estimatedWaitMinutes: number }> {
    try {
      // Get only queues for this machine instead of all queues in system
      const machineQueues = await this.queueRepository.getByMachineId(queue.machineId);
      
      return this.calculateQueueAheadSync(queue, machineQueues);
    } catch (e) {
      return { 
        queueAhead: Math.max(0, queue.position - 1), 
        estimatedWaitMinutes: Math.max(0, queue.position - 1) * 30 // Fallback: 30 min per queue
      };
    }
  }

  /**
   * Helper to calculate queue ahead without fetching data
   */
  private calculateQueueAheadSync(queue: Queue, machineQueues: Queue[]): { queueAhead: number; estimatedWaitMinutes: number } {
    try {
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
    } catch (e) {
      return { 
        queueAhead: Math.max(0, queue.position - 1), 
        estimatedWaitMinutes: Math.max(0, queue.position - 1) * 30 
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
      throw error;
    }
  }

  /**
   * Load queue status data for multiple queue IDs
   * Optimized to fetch data in parallel
   */
  /**
   * Helper to wrap promise with timeout
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Connection timed out (${ms}ms)`)), ms)
      )
    ]);
  }

  async loadQueueStatusData(queueIds: string[]): Promise<QueueStatusData[]> {
    if (!queueIds.length) return [];

    try {
      // ✅ Use RPC to fetch everything in 1 Request
      // This calculates status, waiting time, and queue ahead on the server
      const queuesWithStatus = await this.withTimeout(this.queueRepository.getByIdsWithStatus(queueIds));

      // Map to Presenter Model
      const results: QueueStatusData[] = queuesWithStatus.map(q => ({
        id: q.id,
        machineId: q.machineId,
        customerId: q.customerId,
        machineName: q.machineName || 'Unknown',
        customerName: q.customerName,
        customerPhone: q.customerPhone,
        bookingTime: q.bookingTime,
        duration: q.duration,
        status: q.status as 'waiting' | 'playing' | 'completed' | 'cancelled',
        position: q.position,
        queueAhead: q.queueAhead,
        estimatedWaitMinutes: q.estimatedWaitMinutes,
      }));

      return results;

    } catch (error) {
      console.error('Error loading queue status data:', error);
      // Re-throw so the UI can show the error state
      throw error; 
    }
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
