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
  /** Estimated wait time in minutes - sum of durations from playing + waiting queues ahead */
  estimatedWaitMinutes: number;
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

  /**
   * Get queue by ID
   */
  async getQueueById(id: string): Promise<Queue | null> {
    try {
      return await this.withTimeout(this.queueRepository.getById(id));
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
      return await this.withTimeout(this.machineRepository.getById(id));
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
      return await this.withTimeout(this.queueRepository.getAll());
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
      // Optimize: Get only queues for this machine instead of all
      // And use timeout
      const machineQueues = await this.withTimeout(this.queueRepository.getByMachineId(queue.machineId));
      
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
      await this.withTimeout(this.queueRepository.cancel(queueId, customerId));
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
      return { queue: null, machine: null, queueAhead: 0, estimatedWaitMinutes: 0 };
    }

    const machine = await this.getMachineById(queue.machineId);
    const { queueAhead, estimatedWaitMinutes } = await this.calculateQueueAhead(queue);

    return {
      queue,
      machine,
      queueAhead,
      estimatedWaitMinutes,
    };
  }
}
