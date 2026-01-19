/**
 * SingleQueuePresenter
 * Handles business logic for viewing a single queue status
 * Receives repository via dependency injection
 * 
 * ✅ Updated to use IWalkInQueueRepository (new schema)
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IWalkInQueueRepository, WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { Metadata } from 'next';

export interface SingleQueueViewModel {
  queue: WalkInQueue | null;
  machine: Machine | null;
  queueAhead: number;
  /** Estimated wait time in minutes */
  estimatedWaitMinutes: number;
}

/**
 * Presenter for Single Queue Status page
 * ✅ Receives repository via constructor injection
 */
export class SingleQueuePresenter {
  constructor(
    private readonly walkInQueueRepository: IWalkInQueueRepository,
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
  async getQueueById(id: string): Promise<WalkInQueue | null> {
    try {
      return await this.withTimeout(this.walkInQueueRepository.getById(id));
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
   * Cancel a queue
   */
  async cancelQueue(queueId: string, customerId?: string): Promise<void> {
    try {
      await this.withTimeout(this.walkInQueueRepository.cancel(queueId, customerId));
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

    // Get machine if preferred
    let machine: Machine | null = null;
    if (queue.preferredMachineId) {
      machine = await this.getMachineById(queue.preferredMachineId);
    }

    return {
      queue,
      machine,
      queueAhead: queue.queuesAhead || 0,
      estimatedWaitMinutes: queue.estimatedWaitMinutes || 0,
    };
  }
}
