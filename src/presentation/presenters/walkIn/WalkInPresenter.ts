/**
 * WalkInPresenter
 * Handles business logic for the redesigned Walk-in Queue flow
 */

import { IMachineRepository, Machine } from '@/src/application/repositories/IMachineRepository';
import { IWalkInQueueRepository, JoinWalkInQueueData, WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';

export interface WalkInViewModel {
  currentQueue: WalkInQueue | null;
  availableMachines: Machine[];
  isLoading: boolean;
  error: string | null;
}

export class WalkInPresenter {
  constructor(
    private readonly walkInRepo: IWalkInQueueRepository,
    private readonly machineRepo: IMachineRepository
  ) {}

  /**
   * Join the walk-in queue
   */
  async joinQueue(data: JoinWalkInQueueData): Promise<WalkInQueue> {
    try {
      return await this.walkInRepo.join(data);
    } catch (error) {
      console.error('Error joining queue:', error);
      throw error;
    }
  }

  /**
   * Get queue status for a customer
   */
  async getMyQueueStatus(customerId: string): Promise<WalkInQueue | null> {
    try {
      const queues = await this.walkInRepo.getMyQueueStatus(customerId);
      // Return the most recent active queue
      return queues[0] || null;
    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }

  /**
   * Get available machines
   */
  async getAvailableMachines(): Promise<Machine[]> {
    try {
      return await this.machineRepo.getAvailable();
    } catch (error) {
      console.error('Error getting machines:', error);
      return [];
    }
  }

  /**
   * Cancel a queue entry
   */
  async cancelQueue(queueId: string, customerId: string): Promise<boolean> {
    try {
      return await this.walkInRepo.cancel(queueId, customerId);
    } catch (error) {
      console.error('Error cancelling queue:', error);
      throw error;
    }
  }
}
