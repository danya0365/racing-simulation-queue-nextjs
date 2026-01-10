import { Database } from '@/src/domain/types/supabase';

import { createBrowserClient } from '@supabase/ssr';

// กำหนดค่าเริ่มต้นสำหรับ Supabase URL และ API key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

let client: any = null;

export function createClient() {
  if (client) return client;

  console.log('Initializing Supabase Client (Singleton)...');
  
  // Use default configuration but disable autoRefreshToken on client
  // because Middleware handles token refresh via cookies
  client = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
     {
      global: {
        fetch: (url, options = {}) => {
          // ✅ เพิ่ม timeout สำหรับ fetch requests
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

          return fetch(url, {
            ...options,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId))
        },
      },
    }
  );
  
  return client;
}

// ใช้ใน component
export const supabase = createClient(); // reuse เดิม

export const logActiveConnections = () => {
  const supabase = createClient()
  
  // ดู realtime channels ที่เปิดอยู่
  console.log('Active channels:', supabase.getChannels())
}

logActiveConnections()