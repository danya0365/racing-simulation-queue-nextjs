import {
    CreateCustomerData,
    Customer,
    CustomerListResult,
    CustomerStats,
    ICustomerRepository,
    UpdateCustomerData
} from '@/src/application/repositories/ICustomerRepository';
import { CUSTOMER_CONFIG } from '@/src/config/customerConfig';
import { Database } from '@/src/domain/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';

export class SupabaseCustomerRepository implements ICustomerRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async getAll(limit: number = 20, page: number = 1, search?: string, filter?: string): Promise<CustomerListResult> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (filter === 'vip') {
      query = query.eq('is_vip', true);
    } else if (filter === 'new') {
       // Filter for created today
       // Need to be careful with timezone, but simple date check:
       const todayStart = dayjs().startOf('day').toISOString();
       query = query.gte('created_at', todayStart);
    } else if (filter === 'regular') {
       query = query.gte('visit_count', CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS);
    }

    // Apply pagination
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching customers:', error);
      return { data: [], total: 0 };
    }

    return {
      data: (data || []).map(this.mapToDomain),
      total: count || 0
    };
  }

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async create(data: CreateCustomerData): Promise<Customer> {
    const { data: created, error } = await this.supabase
      .from('customers')
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(created);
  }

  async update(id: string, data: UpdateCustomerData): Promise<Customer> {
    const { data: updated, error } = await this.supabase
      .from('customers')
      .update({
        name: data.name,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        is_vip: data.isVip,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.mapToDomain(updated);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id);

    return !error;
  }

  async incrementVisit(id: string, playTime: number, now: string): Promise<Customer> {
    // This could also be a function in SQL for atomicity
    const { data: current, error: getError } = await this.supabase
      .from('customers')
      .select('visit_count, total_play_time')
      .eq('id', id)
      .single();

    if (getError || !current) throw new Error('Customer not found');

    const { data: updated, error: updateError } = await this.supabase
      .from('customers')
      .update({
        visit_count: (current.visit_count || 0) + 1,
        total_play_time: (current.total_play_time || 0) + playTime,
        last_visit: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    return this.mapToDomain(updated);
  }

  async getStats(todayStr: string): Promise<CustomerStats> {
    const today = dayjs(todayStr).startOf('day');

    const { data, error } = await this.supabase
      .from('customers')
      .select('id, is_vip, created_at, last_visit, visit_count');

    if (error || !data) {
        return {
          totalCustomers: 0,
          vipCustomers: 0,
          newCustomersToday: 0,
          returningCustomers: 0,
        };
    }

    return {
      totalCustomers: data.length,
      vipCustomers: data.filter(c => c.is_vip).length,
      newCustomersToday: data.filter(c => dayjs(c.created_at || '').isAfter(today) || dayjs(c.created_at || '').isSame(today)).length,
      // Use centralized config for "returning/regular" customer threshold
      returningCustomers: data.filter(c => (c.visit_count || 0) >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS).length,
    };
  }

  async getVipCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('is_vip', true)
      .order('name');

    if (error) return [];
    return data.map(this.mapToDomain);
  }

  async getFrequentCustomers(): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .gte('visit_count', CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS)
      .order('visit_count', { ascending: false });

    if (error) return [];
    return data.map(this.mapToDomain);
  }

    private mapToDomain = (raw: Database['public']['Tables']['customers']['Row']): Customer => {
    return {
      id: raw.id,
      name: raw.name,
      phone: raw.phone,
      email: raw.email || undefined,
      visitCount: raw.visit_count || 0,
      totalPlayTime: raw.total_play_time || 0,
      lastVisit: raw.last_visit || undefined,
      createdAt: raw.created_at || '',
      updatedAt: raw.updated_at || '',
      notes: raw.notes || undefined,
      isVip: raw.is_vip || false,
    };
  };
}
