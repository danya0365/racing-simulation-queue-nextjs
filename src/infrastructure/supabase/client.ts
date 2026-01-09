import { Database } from '@/src/domain/types/supabase';

import { createBrowserClient } from '@supabase/ssr';

// กำหนดค่าเริ่มต้นสำหรับ Supabase URL และ API key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-build.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key-for-build';

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
