/**
 * SupabaseSessionRepository
 * Implementation of ISessionRepository using Supabase
 * Following Clean Architecture - Infrastructure layer
 * 
 * ✅ For SERVER-SIDE use only (API Routes, Server Components)
 * ❌ Do NOT use in Client Components directly
 */

import {
    EndSessionData,
    ISessionRepository,
    PaymentStatus,
    Session,
    SessionSourceType,
    SessionStats,
    StartSessionData,
} from '@/src/application/repositories/ISessionRepository';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Type alias for the database row
type SessionRow = {
  id: string;
  station_id: string;
  booking_id: string | null;
  queue_id: string | null;
  customer_name: string;
  start_time: string;
  end_time: string | null;
  total_amount: number | null;
  payment_status: string;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export class SupabaseSessionRepository implements ISessionRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  async getById(id: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        machines:station_id (name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getAll(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        machines:station_id (name)
      `)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getByStationId(stationId: string): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        machines:station_id (name)
      `)
      .eq('station_id', stationId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions by station:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getActiveSession(stationId: string): Promise<Session | null> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        machines:station_id (name)
      `)
      .eq('station_id', stationId)
      .is('end_time', null)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getActiveSessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_active_sessions');

    if (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }

    return (data || []).map((row: {
      session_id: string;
      station_id: string;
      station_name: string;
      customer_name: string;
      start_time: string;
      duration_minutes: number;
      estimated_end_time: string;
      source_type: string;
      payment_status: string;
    }) => ({
      id: row.session_id,
      stationId: row.station_id,
      stationName: row.station_name,
      customerName: row.customer_name,
      startTime: row.start_time,
      estimatedEndTime: row.estimated_end_time,
      durationMinutes: row.duration_minutes,
      sourceType: row.source_type as SessionSourceType,
      totalAmount: 0,
      paymentStatus: row.payment_status as PaymentStatus,
      createdAt: row.start_time,
      updatedAt: row.start_time,
    }));
  }

  async getTodaySessions(): Promise<Session[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_today_sessions');

    if (error) {
      console.error('Error fetching today sessions:', error);
      return [];
    }

    return (data || []).map((row: {
      session_id: string;
      station_id: string;
      station_name: string;
      customer_name: string;
      start_time: string;
      end_time: string | null;
      duration_minutes: number;
      total_amount: number;
      payment_status: string;
      source_type: string;
    }) => ({
      id: row.session_id,
      stationId: row.station_id,
      stationName: row.station_name,
      customerName: row.customer_name,
      startTime: row.start_time,
      endTime: row.end_time || undefined,
      durationMinutes: row.duration_minutes,
      totalAmount: row.total_amount || 0,
      paymentStatus: row.payment_status as PaymentStatus,
      sourceType: row.source_type as SessionSourceType,
      createdAt: row.start_time,
      updatedAt: row.start_time,
    }));
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Session[]> {
    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        machines:station_id (name)
      `)
      .gte('start_time', `${startDate}T00:00:00`)
      .lte('start_time', `${endDate}T23:59:59`)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions by date range:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  // ============================================================
  // WRITE OPERATIONS
  // ============================================================

  async startSession(data: StartSessionData): Promise<Session> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_start_session', {
        p_station_id: data.stationId,
        p_customer_name: data.customerName,
        p_booking_id: data.bookingId,
        p_queue_id: data.queueId,
        p_notes: data.notes,
        p_estimated_duration_minutes: data.estimatedDurationMinutes ?? 60, // Default 60 min
      });

    if (error) throw error;

    const response = result as { success: boolean; error?: string; session?: {
      id: string;
      stationId: string;
      customerName: string;
      startTime: string;
      paymentStatus: string;
    }};

    if (!response.success || !response.session) {
      throw new Error(response.error || 'ไม่สามารถเริ่ม session ได้');
    }

    return {
      id: response.session.id,
      stationId: response.session.stationId,
      customerName: response.session.customerName,
      startTime: response.session.startTime,
      totalAmount: 0,
      paymentStatus: response.session.paymentStatus as PaymentStatus,
      createdAt: response.session.startTime,
      updatedAt: response.session.startTime,
    };
  }

  async endSession(data: EndSessionData): Promise<Session> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_end_session', {
        p_session_id: data.sessionId,
        p_total_amount: data.totalAmount,
      });

    if (error) throw error;

    const response = result as { success: boolean; error?: string; session?: {
      id: string;
      durationMinutes: number;
      totalAmount: number;
    }};

    if (!response.success) {
      throw new Error(response.error || 'ไม่สามารถจบ session ได้');
    }

    // Get updated session
    const updated = await this.getById(data.sessionId);
    if (!updated) {
      throw new Error('ไม่พบ session หลังอัปเดต');
    }
    return updated;
  }

  async updatePaymentStatus(sessionId: string, status: PaymentStatus): Promise<Session> {
    const { data, error } = await this.supabase
      .rpc('rpc_update_session_payment', {
        p_session_id: sessionId,
        p_payment_status: status,
      });

    if (error) throw error;

    const response = data as { success: boolean; error?: string };
    if (!response.success) {
      throw new Error(response.error || 'ไม่สามารถอัปเดตสถานะการชำระเงินได้');
    }

    // Get updated session
    const updated = await this.getById(sessionId);
    if (!updated) {
      throw new Error('ไม่พบ session หลังอัปเดต');
    }
    return updated;
  }

  // ============================================================
  // STATISTICS
  // ============================================================

  async getStats(dateRange?: { start: string; end: string }): Promise<SessionStats> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_session_stats', {
        p_start_date: dateRange?.start,
        p_end_date: dateRange?.end,
      });

    if (error) {
      console.error('Error fetching session stats:', error);
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

    const stats = data as unknown as SessionStats;
    return stats;
  }

  async getTotalRevenue(dateRange?: { start: string; end: string }): Promise<number> {
    const stats = await this.getStats(dateRange);
    return stats.totalRevenue;
  }

  // ============================================================
  // DOMAIN MAPPING
  // ============================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToDomain = (raw: any): Session => {
    // Calculate duration if end_time exists
    let durationMinutes: number | undefined;
    if (raw.end_time) {
      const start = new Date(raw.start_time);
      const end = new Date(raw.end_time);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    // Determine source type
    let sourceType: SessionSourceType | undefined;
    if (raw.booking_id) {
      sourceType = 'booking';
    } else if (raw.queue_id) {
      sourceType = 'walk_in';
    } else {
      sourceType = 'manual';
    }

    return {
      id: raw.id,
      stationId: raw.station_id,
      stationName: raw.machines?.name || undefined,
      bookingId: raw.booking_id || undefined,
      queueId: raw.queue_id || undefined,
      customerName: raw.customer_name,
      startTime: raw.start_time,
      endTime: raw.end_time || undefined,
      estimatedEndTime: raw.estimated_end_time || undefined,
      durationMinutes,
      totalAmount: raw.total_amount || 0,
      paymentStatus: (raw.payment_status || 'unpaid') as PaymentStatus,
      sourceType,
      notes: raw.notes || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  };
}
