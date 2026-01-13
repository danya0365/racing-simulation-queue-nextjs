/**
 * ApiQueueRepository
 * Implements IQueueRepository using API calls instead of direct Supabase connection
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
    BackendStatsDTO,
    CreateQueueData,
    IQueueRepository,
    PaginatedResult,
    Queue,
    QueueStats,
    QueueStatus,
    QueueWithStatusDTO,
    UpdateQueueData,
} from '@/src/application/repositories/IQueueRepository';

export class ApiQueueRepository implements IQueueRepository {
  private baseUrl = '/api/queues';

  /**
   * Get queue by ID
   */
  async getById(id: string): Promise<Queue | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get queues by IDs
   */
  async getByIds(ids: string[]): Promise<Queue[]> {
    if (ids.length === 0) return [];
    const res = await fetch(`${this.baseUrl}?ids=${ids.join(',')}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get queues by IDs with status (RPC)
   */
  async getByIdsWithStatus(ids: string[]): Promise<QueueWithStatusDTO[]> {
    if (ids.length === 0) return [];
    const res = await fetch(`${this.baseUrl}?action=withStatus&ids=${ids.join(',')}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Search queues by phone number
   */
  async searchByPhone(phone: string, localCustomerId?: string): Promise<Queue[]> {
    const params = new URLSearchParams({ phone });
    if (localCustomerId) {
      params.append('customerId', localCustomerId);
    }
    const res = await fetch(`${this.baseUrl}/search?${params}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถค้นหาคิวได้');
    }
    return res.json();
  }

  /**
   * Get all queues
   */
  async getAll(): Promise<Queue[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get queues by machine ID
   */
  async getByMachineId(machineId: string): Promise<Queue[]> {
    const res = await fetch(`${this.baseUrl}?machineId=${machineId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get waiting queues
   */
  async getWaiting(): Promise<Queue[]> {
    const res = await fetch(`${this.baseUrl}?action=waiting`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get today's queues
   */
  async getToday(todayDate: string): Promise<Queue[]> {
    const res = await fetch(`${this.baseUrl}?action=today&todayDate=${todayDate}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Get paginated queues
   */
  async getPaginated(page: number, perPage: number): Promise<PaginatedResult<Queue>> {
    const res = await fetch(`${this.baseUrl}?page=${page}&perPage=${perPage}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Create a new queue
   */
  async create(data: CreateQueueData): Promise<Queue> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถสร้างคิวได้');
    }
    return res.json();
  }

  /**
   * Update an existing queue
   */
  async update(id: string, data: UpdateQueueData): Promise<Queue> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตคิวได้');
    }
    return res.json();
  }

  /**
   * Delete a queue
   */
  async delete(id: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถลบคิวได้');
    }
    return true;
  }

  /**
   * Get statistics
   */
  async getStats(todayDate: string): Promise<QueueStats> {
    const res = await fetch(`${this.baseUrl}/stats?todayDate=${todayDate}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }

  /**
   * Update queue status
   */
  async updateStatus(id: string, status: QueueStatus): Promise<Queue> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateStatus', status }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตสถานะได้');
    }
    return res.json();
  }

  /**
   * Cancel a queue
   */
  async cancel(id: string, customerId?: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', customerId }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถยกเลิกคิวได้');
    }
    const result = await res.json();
    return result.success;
  }

  /**
   * Get next queue position for a machine
   */
  async getNextPosition(machineId: string): Promise<number> {
    const res = await fetch(`${this.baseUrl}?action=nextPosition&machineId=${machineId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดตำแหน่งคิวได้');
    }
    const result = await res.json();
    return result.position;
  }

  /**
   * Get active queues (waiting/playing) + recently finished
   */
  async getActiveAndRecent(referenceTime: string): Promise<Queue[]> {
    const res = await fetch(`${this.baseUrl}?action=activeAndRecent&referenceTime=${encodeURIComponent(referenceTime)}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    return res.json();
  }

  /**
   * Reset all queues for a machine
   * Note: This is an admin action, may need additional authorization
   */
  async resetMachineQueue(machineId: string, now: string): Promise<{ cancelledCount: number; completedCount: number }> {
    const res = await fetch(`${this.baseUrl}?action=reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId, now }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถรีเซ็ตคิวได้');
    }
    return res.json();
  }

  /**
   * Get backend dashboard stats (RPC)
   */
  async getBackendStats(): Promise<BackendStatsDTO | null> {
    const res = await fetch(`${this.baseUrl}/stats?action=backend`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถิติได้');
    }
    return res.json();
  }
}
