/**
 * HomePresenter
 * Handles business logic for Home page
 * Receives repository via dependency injection
 */

import { IMachineRepository, Machine, MachineStats } from '@/src/application/repositories/IMachineRepository';
import { IQueueRepository, Queue, QueueStats } from '@/src/application/repositories/IQueueRepository';
import { Metadata } from 'next';

export interface HomeViewModel {
  machines: Machine[];
  machineStats: MachineStats;
  waitingQueues: Queue[];
  queueStats: QueueStats;
  currentTime: string;
}

/**
 * Presenter for Home page
 * ✅ Receives repositories via constructor injection
 */
export class HomePresenter {
  constructor(
    private readonly machineRepository: IMachineRepository,
    private readonly queueRepository: IQueueRepository
  ) {}

  /**
   * Get view model for the home page
   */
  async getViewModel(): Promise<HomeViewModel> {
    try {
      // Get data in parallel for better performance
      const [allMachines, machineStats, waitingQueues, queueStats] = await Promise.all([
        this.machineRepository.getAll(),
        this.machineRepository.getStats(),
        this.queueRepository.getWaiting(),
        this.queueRepository.getStats(),
      ]);

      // Filter only active machines for client display
      // isActive = false means hidden from clients completely
      const machines = allMachines.filter(m => m.isActive);

      return {
        machines,
        machineStats,
        waitingQueues,
        queueStats,
        currentTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting home view model:', error);
      throw error;
    }
  }

  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'Racing Queue - หน้าแรก',
      description: 'ระบบจองคิวสำหรับร้านเกม Racing Simulation - ดูสถานะเครื่องและจองคิวได้ง่ายๆ',
    };
  }

  /**
   * Get available machines for booking
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
}
