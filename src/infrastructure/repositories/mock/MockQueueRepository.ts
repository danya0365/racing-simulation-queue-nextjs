/**
 * MockQueueRepository
 * Mock implementation for development and testing
 * Following Clean Architecture - Infrastructure layer
 */

import {
    CreateQueueData,
    IQueueRepository,
    PaginatedResult,
    Queue,
    QueueStats,
    QueueStatus,
    UpdateQueueData,
} from '@/src/application/repositories/IQueueRepository';

// Helper to create today's date with specific time
function todayAt(hours: number, minutes: number = 0): string {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// Mock data for queues - using dynamic dates
const createMockQueues = (): Queue[] => [
  {
    id: 'queue-001',
    machineId: 'machine-002',
    customerName: 'สมชาย ใจดี',
    customerPhone: '081-234-5678',
    bookingTime: todayAt(10, 0),
    duration: 60,
    status: 'playing',
    position: 1,
    notes: 'ลูกค้าประจำ',
    createdAt: todayAt(9, 30),
    updatedAt: todayAt(10, 0),
  },
  {
    id: 'queue-002',
    machineId: 'machine-004',
    customerName: 'อนุชา มั่นคง',
    customerPhone: '089-876-5432',
    bookingTime: todayAt(11, 0),
    duration: 30,
    status: 'playing',
    position: 1,
    createdAt: todayAt(10, 45),
    updatedAt: todayAt(11, 0),
  },
  {
    id: 'queue-003',
    machineId: 'machine-001',
    customerName: 'วิชัย รักเร็ว',
    customerPhone: '062-111-2222',
    bookingTime: todayAt(12, 0),
    duration: 60,
    status: 'waiting',
    position: 1,
    notes: 'จองล่วงหน้า',
    createdAt: todayAt(8, 0),
    updatedAt: todayAt(8, 0),
  },
  {
    id: 'queue-004',
    machineId: 'machine-001',
    customerName: 'ประยุทธ์ แข่งดี',
    customerPhone: '091-333-4444',
    bookingTime: todayAt(13, 0),
    duration: 45,
    status: 'waiting',
    position: 2,
    createdAt: todayAt(9, 0),
    updatedAt: todayAt(9, 0),
  },
  {
    id: 'queue-005',
    machineId: 'machine-003',
    customerName: 'ธนพล สปีด',
    customerPhone: '083-555-6666',
    bookingTime: todayAt(14, 0),
    duration: 90,
    status: 'waiting',
    position: 1,
    notes: 'VIP Member',
    createdAt: todayAt(7, 0),
    updatedAt: todayAt(7, 0),
  },
  {
    id: 'queue-006',
    machineId: 'machine-005',
    customerName: 'กิตติ F1',
    customerPhone: '095-777-8888',
    bookingTime: todayAt(9, 0),
    duration: 60,
    status: 'completed',
    position: 1,
    createdAt: todayAt(8, 30),
    updatedAt: todayAt(10, 0),
  },
];

export class MockQueueRepository implements IQueueRepository {
  private queues: Queue[] = createMockQueues();

  async getById(id: string): Promise<Queue | null> {
    await this.delay(100);
    return this.queues.find((queue) => queue.id === id) || null;
  }

  async getAll(): Promise<Queue[]> {
    await this.delay(100);
    return [...this.queues].sort((a, b) => 
      new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()
    );
  }

  async getByMachineId(machineId: string): Promise<Queue[]> {
    await this.delay(100);
    return this.queues
      .filter((queue) => queue.machineId === machineId)
      .sort((a, b) => a.position - b.position);
  }

  async getWaiting(): Promise<Queue[]> {
    await this.delay(100);
    return this.queues
      .filter((queue) => queue.status === 'waiting')
      .sort((a, b) => 
        new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()
      );
  }

  async getToday(): Promise<Queue[]> {
    await this.delay(100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.queues
      .filter((queue) => {
        const bookingDate = new Date(queue.bookingTime);
        return bookingDate >= today && bookingDate < tomorrow;
      })
      .sort((a, b) => 
        new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime()
      );
  }

  async getPaginated(page: number, perPage: number): Promise<PaginatedResult<Queue>> {
    await this.delay(100);

    const sortedQueues = [...this.queues].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedQueues = sortedQueues.slice(start, end);

    return {
      data: paginatedQueues,
      total: this.queues.length,
      page,
      perPage,
    };
  }

  async create(data: CreateQueueData): Promise<Queue> {
    await this.delay(200);

    const position = await this.getNextPosition(data.machineId);

    const newQueue: Queue = {
      id: `queue-${Date.now()}`,
      ...data,
      status: 'waiting',
      position,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.queues.push(newQueue);
    return newQueue;
  }

  async update(id: string, data: UpdateQueueData): Promise<Queue> {
    await this.delay(200);

    const index = this.queues.findIndex((queue) => queue.id === id);
    if (index === -1) {
      throw new Error('Queue not found');
    }

    const updatedQueue: Queue = {
      ...this.queues[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.queues[index] = updatedQueue;
    return updatedQueue;
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(200);

    const index = this.queues.findIndex((queue) => queue.id === id);
    if (index === -1) {
      return false;
    }

    this.queues.splice(index, 1);
    return true;
  }

  async getStats(): Promise<QueueStats> {
    await this.delay(100);

    const totalQueues = this.queues.length;
    const waitingQueues = this.queues.filter((q) => q.status === 'waiting').length;
    const playingQueues = this.queues.filter((q) => q.status === 'playing').length;
    const completedQueues = this.queues.filter((q) => q.status === 'completed').length;
    const cancelledQueues = this.queues.filter((q) => q.status === 'cancelled').length;

    return {
      totalQueues,
      waitingQueues,
      playingQueues,
      completedQueues,
      cancelledQueues,
    };
  }

  async updateStatus(id: string, status: QueueStatus): Promise<Queue> {
    await this.delay(200);

    const index = this.queues.findIndex((queue) => queue.id === id);
    if (index === -1) {
      throw new Error('Queue not found');
    }

    const updatedQueue: Queue = {
      ...this.queues[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    this.queues[index] = updatedQueue;
    return updatedQueue;
  }

  async getNextPosition(machineId: string): Promise<number> {
    await this.delay(50);

    const machineQueues = this.queues.filter(
      (queue) => queue.machineId === machineId && 
      (queue.status === 'waiting' || queue.status === 'playing')
    );

    if (machineQueues.length === 0) {
      return 1;
    }

    const maxPosition = Math.max(...machineQueues.map((q) => q.position));
    return maxPosition + 1;
  }

  async cancel(id: string, customerId?: string): Promise<boolean> {
    await this.delay(200);

    const index = this.queues.findIndex((queue) => queue.id === id);
    if (index === -1) {
      return false;
    }

    // In mock, we don't verify customerId since it's for testing
    // Just update status to cancelled
    this.queues[index] = {
      ...this.queues[index],
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    };

    return true;
  }

  // Helper method to simulate network delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance for convenience
export const mockQueueRepository = new MockQueueRepository();
