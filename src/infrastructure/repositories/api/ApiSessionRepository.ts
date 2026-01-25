/**
 * ApiSessionRepository
 * Implements ISessionRepository using API calls
 * 
 * ✅ For use in CLIENT-SIDE components only
 * ✅ No connection pool issues - calls go through Next.js API routes
 */

'use client';

import {
  EndSessionData,
  ISessionRepository,
  PaymentStatus,
  Session,
  SessionStats,
  StartSessionData,
} from '@/src/application/repositories/ISessionRepository';

export class ApiSessionRepository implements ISessionRepository {
  private baseUrl = '/api/sessions';

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  async getById(id: string): Promise<Session | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล session ได้');
    }
    
    return res.json();
  }

  async getAll(limit: number = 50, page: number = 1): Promise<Session[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (page) params.set('page', page.toString());

    const res = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล sessions ได้');
    }
    
    return res.json();
  }

  async getByStationId(stationId: string, limit: number = 30, page: number = 1): Promise<Session[]> {
    const params = new URLSearchParams({ stationId });
    if (limit) params.set('limit', limit.toString());
    if (page) params.set('page', page.toString());
    
    const res = await fetch(`${this.baseUrl}?${params.toString()}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล sessions ได้');
    }
    
    return res.json();
  }

  async getActiveSession(stationId: string): Promise<Session | null> {
    const res = await fetch(`${this.baseUrl}/active?stationId=${stationId}`);
    
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล session ได้');
    }
    
    return res.json();
  }

  async getActiveSessions(): Promise<Session[]> {
    const res = await fetch(`${this.baseUrl}/active`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล sessions ได้');
    }
    
    return res.json();
  }

  async getTodaySessions(): Promise<Session[]> {
    const res = await fetch(`${this.baseUrl}/today`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล sessions ได้');
    }
    
    return res.json();
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Session[]> {
    const res = await fetch(`${this.baseUrl}?startDate=${startDate}&endDate=${endDate}`);
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถโหลดข้อมูล sessions ได้');
    }
    
    return res.json();
  }

  // ============================================================
  // WRITE OPERATIONS
  // ============================================================

  async startSession(data: StartSessionData): Promise<Session> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถเริ่ม session ได้');
    }
    
    return res.json();
  }

  async endSession(data: EndSessionData): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/${data.sessionId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount: data.totalAmount }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถจบการเล่นได้');
    }
    
    return res.json();
  }

  async updatePaymentStatus(sessionId: string, status: PaymentStatus): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/${sessionId}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตสถานะการชำระเงินได้');
    }
    
    return res.json();
  }

  async updateTotalAmount(sessionId: string, totalAmount: number): Promise<Session> {
    const res = await fetch(`${this.baseUrl}/${sessionId}/amount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ totalAmount }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'ไม่สามารถอัปเดตราคาได้');
    }
    
    return res.json();
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  async getStats(dateRange?: { start: string; end: string }): Promise<SessionStats> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.set('startDate', dateRange.start);
      params.set('endDate', dateRange.end);
    }
    
    const res = await fetch(`${this.baseUrl}/stats?${params.toString()}`);
    if (!res.ok) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        completedSessions: 0,
        totalRevenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
        averageDurationMinutes: 0,
      };
    }
    
    return res.json();
  }

  async getTotalRevenue(dateRange?: { start: string; end: string }): Promise<number> {
    const stats = await this.getStats(dateRange);
    return stats.totalRevenue;
  }
}
