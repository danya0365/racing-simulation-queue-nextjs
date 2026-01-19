/**
 * SupabaseWalkInQueueRepository
 * Implementation of IWalkInQueueRepository using Supabase
 * Following Clean Architecture - Infrastructure layer
 * 
 * ✅ For SERVER-SIDE use only (API Routes, Server Components)
 * ❌ Do NOT use in Client Components directly
 */

import {
    IWalkInQueueRepository,
    JoinWalkInQueueData,
    SeatCustomerData,
    WalkInQueue,
    WalkInQueueStats,
    WalkInStatus,
} from '@/src/application/repositories/IWalkInQueueRepository';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

// Type alias for the database row (will be available after type generation)
type WalkInQueueRow = {
  id: string;
  customer_id: string;
  preferred_machine_id: string | null;
  party_size: number;
  preferred_station_type: string | null;
  queue_number: number;
  status: string;
  notes: string | null;
  joined_at: string;
  called_at: string | null;
  seated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export class SupabaseWalkInQueueRepository implements IWalkInQueueRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ============================================================
  // READ OPERATIONS
  // ============================================================

  async getById(id: string): Promise<WalkInQueue | null> {
    const { data, error } = await this.supabase
      .from('walk_in_queue')
      .select(`
        *,
        customers:customer_id (name, phone),
        machines:preferred_machine_id (name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getAll(): Promise<WalkInQueue[]> {
    const { data, error } = await this.supabase
      .from('walk_in_queue')
      .select(`
        *,
        customers:customer_id (name, phone),
        machines:preferred_machine_id (name)
      `)
      .order('queue_number', { ascending: true });

    if (error) {
      console.error('Error fetching walk-in queue:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getWaiting(): Promise<WalkInQueue[]> {
    // Use RPC for better performance
    const { data, error } = await this.supabase
      .rpc('rpc_get_waiting_queue');

    if (error) {
      console.error('Error fetching waiting queue:', error);
      return [];
    }

    // Map RPC result to domain
    return (data || []).map((row: {
      queue_id: string;
      queue_number: number;
      customer_name: string;
      customer_phone_masked: string;
      party_size: number;
      preferred_station_type: string | null;
      preferred_machine_name: string | null;
      status: string;
      joined_at: string;
      wait_time_minutes: number;
    }) => ({
      id: row.queue_id,
      customerId: '',
      customerName: row.customer_name,
      customerPhone: row.customer_phone_masked,
      preferredMachineId: undefined,
      preferredMachineName: row.preferred_machine_name || undefined,
      partySize: row.party_size,
      preferredStationType: row.preferred_station_type || undefined,
      queueNumber: row.queue_number,
      status: row.status as WalkInStatus,
      joinedAt: row.joined_at,
      waitTimeMinutes: row.wait_time_minutes,
      createdAt: row.joined_at,
      updatedAt: row.joined_at,
    }));
  }

  async getByCustomerId(customerId: string): Promise<WalkInQueue[]> {
    const { data, error } = await this.supabase
      .from('walk_in_queue')
      .select(`
        *,
        customers:customer_id (name, phone),
        machines:preferred_machine_id (name)
      `)
      .eq('customer_id', customerId)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer queue:', error);
      return [];
    }

    return (data || []).map(this.mapToDomain);
  }

  async getMyQueueStatus(customerId: string): Promise<WalkInQueue[]> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_my_walk_in_queue', { p_customer_id: customerId });

    if (error) {
      console.error('Error fetching my queue status:', error);
      return [];
    }

    return (data || []).map((row: {
      queue_id: string;
      queue_number: number;
      party_size: number;
      preferred_station_type: string | null;
      status: string;
      queues_ahead: number;
      estimated_wait_minutes: number;
      joined_at: string;
      called_at: string | null;
    }) => ({
      id: row.queue_id,
      customerId,
      customerName: '',
      customerPhone: '',
      partySize: row.party_size,
      preferredStationType: row.preferred_station_type || undefined,
      queueNumber: row.queue_number,
      status: row.status as WalkInStatus,
      joinedAt: row.joined_at,
      calledAt: row.called_at || undefined,
      queuesAhead: row.queues_ahead,
      estimatedWaitMinutes: row.estimated_wait_minutes,
      createdAt: row.joined_at,
      updatedAt: row.joined_at,
    }));
  }

  // ============================================================
  // WRITE OPERATIONS
  // ============================================================

  async join(data: JoinWalkInQueueData): Promise<WalkInQueue> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_join_walk_in_queue', {
        p_customer_name: data.customerName,
        p_customer_phone: data.customerPhone,
        p_party_size: data.partySize || 1,
        p_preferred_station_type: data.preferredStationType,
        p_preferred_machine_id: data.preferredMachineId,
        p_notes: data.notes,
      });

    if (error) throw error;

    const response = result as { success: boolean; error?: string; queue?: {
      id: string;
      customerId: string;
      queueNumber: number;
      partySize: number;
      preferredStationType: string | null;
      status: string;
      joinedAt: string;
    }};

    if (!response.success || !response.queue) {
      throw new Error(response.error || 'ไม่สามารถเข้าคิวได้');
    }

    return {
      id: response.queue.id,
      customerId: response.queue.customerId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      partySize: response.queue.partySize,
      preferredStationType: response.queue.preferredStationType || undefined,
      queueNumber: response.queue.queueNumber,
      status: response.queue.status as WalkInStatus,
      joinedAt: response.queue.joinedAt,
      createdAt: response.queue.joinedAt,
      updatedAt: response.queue.joinedAt,
    };
  }

  async callCustomer(queueId: string): Promise<WalkInQueue> {
    const { data, error } = await this.supabase
      .rpc('rpc_call_queue_customer', { p_queue_id: queueId });

    if (error) throw error;

    const response = data as { success: boolean; error?: string };
    if (!response.success) {
      throw new Error(response.error || 'ไม่สามารถเรียกลูกค้าได้');
    }

    // Get updated queue
    const updated = await this.getById(queueId);
    if (!updated) {
      throw new Error('ไม่พบคิวหลังอัปเดต');
    }
    return updated;
  }

  async seatCustomer(data: SeatCustomerData): Promise<WalkInQueue> {
    const { data: result, error } = await this.supabase
      .rpc('rpc_seat_queue_customer', {
        p_queue_id: data.queueId,
        p_machine_id: data.machineId,
      });

    if (error) throw error;

    const response = result as { success: boolean; error?: string };
    if (!response.success) {
      throw new Error(response.error || 'ไม่สามารถจัดที่นั่งได้');
    }

    // Get updated queue
    const updated = await this.getById(data.queueId);
    if (!updated) {
      throw new Error('ไม่พบคิวหลังอัปเดต');
    }
    return updated;
  }

  async cancel(queueId: string, customerId?: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('rpc_cancel_walk_in_queue', {
        p_queue_id: queueId,
        p_customer_id: customerId,
      });

    if (error) {
      console.error('Error cancelling queue:', error);
      return false;
    }

    const response = data as { success: boolean; error?: string };
    return response.success;
  }

  async getNextQueueNumber(): Promise<number> {
    const { data, error } = await this.supabase
      .from('walk_in_queue')
      .select('queue_number')
      .gte('joined_at', new Date().toISOString().split('T')[0])
      .order('queue_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 1;
    }

    return data[0].queue_number + 1;
  }

  async getStats(): Promise<WalkInQueueStats> {
    const { data, error } = await this.supabase
      .rpc('rpc_get_walk_in_queue_stats');

    if (error) {
      console.error('Error fetching queue stats:', error);
      return {
        waitingCount: 0,
        calledCount: 0,
        seatedToday: 0,
        cancelledToday: 0,
        averageWaitMinutes: 0,
      };
    }

    const stats = data as {
      waitingCount: number;
      calledCount: number;
      seatedToday: number;
      cancelledToday: number;
      averageWaitMinutes: number;
    };

    return stats;
  }

  // ============================================================
  // DOMAIN MAPPING
  // ============================================================

  private mapToDomain = (raw: WalkInQueueRow & {
    customers?: { name: string; phone: string } | null;
    machines?: { name: string } | null;
  }): WalkInQueue => {
    return {
      id: raw.id,
      customerId: raw.customer_id,
      customerName: raw.customers?.name || '',
      customerPhone: raw.customers?.phone || '',
      preferredMachineId: raw.preferred_machine_id || undefined,
      preferredMachineName: raw.machines?.name || undefined,
      partySize: raw.party_size,
      preferredStationType: raw.preferred_station_type || undefined,
      queueNumber: raw.queue_number,
      status: raw.status as WalkInStatus,
      notes: raw.notes || undefined,
      joinedAt: raw.joined_at,
      calledAt: raw.called_at || undefined,
      seatedAt: raw.seated_at || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
    };
  };
}
