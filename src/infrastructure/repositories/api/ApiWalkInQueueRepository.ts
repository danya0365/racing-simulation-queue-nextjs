/**
 * ApiWalkInQueueRepository
 * Implements IWalkInQueueRepository using API calls
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
  IWalkInQueueRepository,
  JoinWalkInQueueData,
  WalkInQueue,
  WalkInQueueStats
} from '@/src/application/repositories/IWalkInQueueRepository';

export class ApiWalkInQueueRepository implements IWalkInQueueRepository {
  private baseUrl = '/api/walk-in-queue';

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  async getById(id: string): Promise<WalkInQueue | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    
    return res.json();
  }

  async getAll(): Promise<WalkInQueue[]> {
    const res = await fetch(this.baseUrl);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    
    return res.json();
  }

  async getWaiting(): Promise<WalkInQueue[]> {
    const res = await fetch(`${this.baseUrl}?status=waiting`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    
    return res.json();
  }

  async getByCustomerId(customerId: string): Promise<WalkInQueue[]> {
    const res = await fetch(`${this.baseUrl}?customerId=${customerId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูลคิวได้');
    }
    
    return res.json();
  }

  async getMyQueueStatus(customerId: string): Promise<WalkInQueue[]> {
    const res = await fetch(`${this.baseUrl}/my-status?customerId=${customerId}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดสถานะคิวได้');
    }
    
    return res.json();
  }

  // ============================================================
  // WRITE OPERATIONS
  // ============================================================

  async join(data: JoinWalkInQueueData): Promise<WalkInQueue> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถเข้าคิวได้');
    }
    
    return res.json();
  }

  async callCustomer(queueId: string): Promise<WalkInQueue> {
    const res = await fetch(`${this.baseUrl}/${queueId}/call`, {
      method: 'POST',
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถเรียกลูกค้าได้');
    }
    
    return res.json();
  }



  async cancel(queueId: string, customerId?: string): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/${queueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', customerId }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถยกเลิกคิวได้');
    }
    
    return true;
  }

  async getNextQueueNumber(): Promise<number> {
    const res = await fetch(`${this.baseUrl}/next-number`);
    if (!res.ok) {
      return 1;
    }
    
    const data = await res.json();
    return data.nextNumber || 1;
  }

  async getStats(): Promise<WalkInQueueStats> {
    const res = await fetch(`${this.baseUrl}/stats`);
    if (!res.ok) {
      return {
        waitingCount: 0,
        calledCount: 0,
        seatedToday: 0,
        cancelledToday: 0,
        averageWaitMinutes: 0,
      };
    }
    
    return res.json();
  }
}
