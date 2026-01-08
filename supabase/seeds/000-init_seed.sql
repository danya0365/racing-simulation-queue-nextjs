-- Shop Queue Seed Data - Users
-- Created: 2025-06-19
-- Author: Marosdee Uma
-- Description: Sample user data for testing Shop Queue application

-- Set app password for testing
set session my.app_password = '12345678';

-- เพิ่มผู้ใช้ทดสอบใน auth.users
-- ใช้ฟังก์ชัน crypt และ gen_salt เพื่อเข้ารหัสรหัสผ่าน
INSERT INTO
    auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES 
    -- Admin user
    (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000001',
        'authenticated',
        'authenticated',
        'admin@racing.com',
        crypt (current_setting('my.app_password'), gen_salt ('bf')),
        NOW() - INTERVAL '30 days',
        NULL,
        NOW() - INTERVAL '1 day',
        '{"provider":"email","providers":["email"]}',
        '{
          "username": "admin",
          "full_name": "Admin User",
          "role": "admin",
          "is_active": true
        }',
        NOW() - INTERVAL '30 days',
        NOW() - INTERVAL '30 days',
        '',
        '',
        '',
        ''
    ),
    -- Regular user 1
    (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000003',
        'authenticated',
        'authenticated',
        'user1@shopqueue.com',
        crypt (current_setting('my.app_password'), gen_salt ('bf')),
        NOW() - INTERVAL '20 days',
        NULL,
        NOW() - INTERVAL '3 days',
        '{"provider":"email","providers":["email"]}',
        '{
          "username": "user1",
          "full_name": "Regular User 1",
          "role": "user",
          "is_active": true
        }',
        NOW() - INTERVAL '20 days',
        NOW() - INTERVAL '20 days',
        '',
        '',
        '',
        ''
    ),
    -- Regular user 2
    (
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000004',
        'authenticated',
        'authenticated',
        'user2@shopqueue.com',
        crypt (current_setting('my.app_password'), gen_salt ('bf')),
        NOW() - INTERVAL '15 days',
        NULL,
        NOW() - INTERVAL '4 days',
        '{"provider":"email","providers":["email"]}',
        '{
          "username": "user2",
          "full_name": "Regular User 2",
          "role": "user",
          "is_active": true
        }',
        NOW() - INTERVAL '15 days',
        NOW() - INTERVAL '15 days',
        '',
        '',
        '',
        ''
    );

-- Create identities for each user using subquery from auth.users
INSERT INTO
    auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    )
SELECT
    uuid_generate_v4(),
    id,
    id,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    last_sign_in_at,
    created_at,
    updated_at
FROM
    auth.users
ON CONFLICT (provider_id, provider) DO NOTHING;

--  ShopQueue Seed Data - Profiles
-- Created: 2025-06-19
-- Author: Marosdee Uma
-- Description: Sample profile data for testing ShopQueue application with multiple profiles per user

-- Insert profiles for admin user (2 profiles)
INSERT INTO public.profiles (
  id,
  auth_id,
  username,
  full_name,
  avatar_url,
  is_active,
  created_at,
  updated_at
)
VALUES
  (
    '10000000-1000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin_personal',
    'Admin Personal Account',
    '',
    FALSE,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  
  -- Insert profiles for regular user 1 (3 profiles)
  (
    '10000000-1000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000003',
    'user1_gaming',
    'User1 Gaming Channel',
    '',
    FALSE,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '18 days'
  ),
  (
    '10000000-1000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    'user1_movies',
    'User1 Movie Reviews',
    '',
    FALSE,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  
  -- Insert profiles for regular user 2 (2 profiles)
  (
    '10000000-1000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000004',
    'user2_tech',
    'User2 Tech Channel',
    '',
    FALSE,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Created at: 2025-06-21T10:15:00+07:00
-- Author: Marosdee Uma
-- Description: Seed initial profile_roles data for ShopQueue application

-- Insert initial admin role for the first user's active profile
-- This assumes the first user in auth.users is the system admin
INSERT INTO public.profile_roles (profile_id, role, granted_by)
SELECT 
  p.id, 
  'admin'::public.profile_role, 
  p.auth_id
FROM 
  public.profiles p
  JOIN auth.users u ON p.auth_id = u.id
WHERE
  p.is_active = true
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (profile_id) DO UPDATE
SET role = 'admin'::public.profile_role;

-- Execute the migration function
SELECT public.migrate_profile_roles();

-- ============================================================================
-- RACING SYSTEM: Seed Machines
-- ============================================================================
INSERT INTO public.machines (id, name, description, position, status, is_active)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Racing Sim 1', 'เครื่อง Formula Racing Simulator พร้อมพวงมาลัย Fanatec GT DD Pro', 1, 'available', TRUE),
  ('00000000-0000-0000-0000-000000000102', 'Racing Sim 2', 'เครื่อง GT Racing Simulator พร้อมพวงมาลัย Thrustmaster T300RS', 2, 'available', TRUE),
  ('00000000-0000-0000-0000-000000000103', 'Racing Sim 3', 'เครื่อง Rally Racing Simulator พร้อมพวงมาลัย Logitech G923', 3, 'available', TRUE),
  ('00000000-0000-0000-0000-000000000104', 'Racing Sim 4', 'เครื่อง Drift Simulator พร้อมจอโค้ง Ultrawide 49 นิ้ว', 4, 'available', TRUE),
  ('00000000-0000-0000-0000-000000000105', 'Racing Sim 5', 'เครื่อง F1 Simulator VIP พร้อมระบบ Motion Platform', 5, 'available', TRUE),
  ('00000000-0000-0000-0000-000000000106', 'Racing Sim 6', 'เครื่อง Endurance Simulator ระดับ Pro สำหรับ E-Sports', 6, 'maintenance', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RACING SYSTEM: Seed Customers (Additional)
-- ============================================================================
INSERT INTO public.customers (id, name, phone, visit_count, total_play_time, is_vip, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'สมชาย ใจดี', '0812345678', 12, 720, TRUE, NOW() - INTERVAL '60 days'),
  ('00000000-0000-0000-0000-000000000202', 'สมหญิง รักเกม', '0823456789', 8, 480, TRUE, NOW() - INTERVAL '45 days'),
  ('00000000-0000-0000-0000-000000000203', 'วิชัย เร็วแรง', '0834567890', 5, 300, FALSE, NOW() - INTERVAL '30 days'),
  ('00000000-0000-0000-0000-000000000204', 'มานี มีสุข', '0845678901', 3, 180, FALSE, NOW() - INTERVAL '20 days'),
  ('00000000-0000-0000-0000-000000000205', 'ณัฐพล สปีด', '0856789012', 1, 60, FALSE, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000206', 'กิตติ F1', '0867890123', 20, 1200, TRUE, NOW() - INTERVAL '90 days'),
  ('00000000-0000-0000-0000-000000000207', 'อนันดา ขาซิ่ง', '0878901234', 2, 120, FALSE, NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000208', 'แพรวพราว เรซซิ่ง', '0889012345', 15, 900, TRUE, NOW() - INTERVAL '40 days'),
  ('00000000-0000-0000-0000-000000000209', 'โชติช่วง ชำนาญ', '0890123456', 4, 240, FALSE, NOW() - INTERVAL '15 days'),
  ('00000000-0000-0000-0000-000000000210', 'ธันวา พาสนุก', '0801234567', 1, 30, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RACING SYSTEM: Seed Historical Queues (Last 30 Days)
-- ============================================================================
-- This block generates random historical data
DO $$
DECLARE
    v_machine_id UUID;
    v_customer_id UUID;
    v_day RECORD;
    v_hour RECORD;
    v_status public.queue_status;
    v_duration INTEGER;
BEGIN
    -- Loop through the last 30 days
    FOR v_day IN SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day')::date as d LOOP
        
        -- Generate 5-15 bookings per day
        FOR i IN 1..(floor(random() * 11 + 5)) LOOP
            
            -- Pick a random machine
            SELECT id INTO v_machine_id FROM public.machines ORDER BY random() LIMIT 1;
            
            -- Pick a random customer (including potential guests who aren't in the table, but for seed we use existing)
            SELECT id INTO v_customer_id FROM public.customers ORDER BY random() LIMIT 1;
            
            -- Status distribution: mostly completed, some cancelled
            IF random() < 0.15 THEN
                v_status := 'cancelled';
            ELSE
                v_status := 'completed';
            END IF;

            -- If it's today, allow waiting/playing
            IF v_day.d = CURRENT_DATE THEN
                IF random() < 0.2 THEN
                    v_status := 'waiting';
                ELSIF random() < 0.4 THEN
                    v_status := 'playing';
                END IF;
            END IF;

            -- Duration: 30, 60, 90, 120
            v_duration := (ARRAY[30, 60, 90, 120])[floor(random() * 4 + 1)];

            INSERT INTO public.queues (
                machine_id, 
                customer_id, 
                booking_time, 
                duration, 
                status, 
                position, 
                created_at
            ) VALUES (
                v_machine_id,
                v_customer_id,
                v_day.d + (floor(random() * 12 + 10) || ' hours')::interval + (floor(random() * 60) || ' minutes')::interval,
                v_duration,
                v_status,
                1,
                v_day.d + (floor(random() * 24) || ' hours')::interval
            );
        END LOOP;
    END LOOP;
END $$;