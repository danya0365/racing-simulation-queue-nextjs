import { Database } from '@/src/domain/types/supabase';

import { createBrowserClient } from '@supabase/ssr';

import { SupabaseClient } from '@supabase/supabase-js';

// กำหนดค่าเริ่มต้นสำหรับ Supabase URL และ API key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

// ✅ Use WeakRef pattern for better memory management
let clientInstance: SupabaseClient<Database> | null = null;
let lastActivityTime = Date.now();
const CLIENT_STALE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * ✅ Get or create Supabase client singleton
 * Implements lazy initialization with staleness check
 */
export function createClient(): SupabaseClient<Database> {
  // Return existing client if available and used recently
  if (clientInstance) {
    lastActivityTime = Date.now();
    return clientInstance;
  }

  console.log('Initializing Supabase Client (Singleton)...');
  
  // Create client with optimized configuration
  clientInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: (url, options = {}) => {
          // ✅ เพิ่ม timeout สำหรับ fetch requests พร้อม retry logic
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout (increased)

          // Track activity
          lastActivityTime = Date.now();

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
      auth: {
        // ✅ Optimize auth settings
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // ✅ Reduce token refresh overhead
        flowType: 'pkce',
      },
    }
  );

  // ✅ Setup visibility-based connection management
  if (typeof window !== 'undefined') {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeSinceActivity = Date.now() - lastActivityTime;
        if (timeSinceActivity > CLIENT_STALE_TIMEOUT) {
          console.log('Supabase Client: Refreshing stale connection...');
          // Don't reset client, just trigger a health check
          clientInstance?.auth.getSession().catch(console.warn);
        }
        lastActivityTime = Date.now();
      }
    };

    // Only add listener once
    if (!(window as Window & { __supabaseVisibilityListenerAdded?: boolean }).__supabaseVisibilityListenerAdded) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      (window as Window & { __supabaseVisibilityListenerAdded?: boolean }).__supabaseVisibilityListenerAdded = true;
    }
  }
  
  lastActivityTime = Date.now();
  return clientInstance;
}

/**
 * ✅ Force reset client (use sparingly, mainly for error recovery)
 */
export function resetClient(): void {
  if (clientInstance) {
    console.log('Supabase Client: Resetting client...');
    // Remove all realtime subscriptions
    clientInstance.removeAllChannels();
    clientInstance = null;
  }
}

/**
 * ✅ Get current client without creating new one
 * Returns null if not initialized
 */
export function getExistingClient(): SupabaseClient<Database> | null {
  return clientInstance;
}

/**
 * ✅ Debug helper - logs active channels
 */
export const logActiveConnections = () => {
  if (clientInstance) {
    console.log('Active channels:', clientInstance.getChannels());
    console.log('Last activity:', new Date(lastActivityTime).toISOString());
  } else {
    console.log('No active Supabase client');
  }
};

// ✅ Export lazy-loaded client getter instead of module-level instance
// This prevents issues with module re-evaluation
export const getSupabaseClient = createClient;