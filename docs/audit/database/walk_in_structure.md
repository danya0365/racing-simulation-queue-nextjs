# 🚶‍♂️ Database Audit: Walk-in Queue System

**Target Table**: `public.walk_in_queue`
**Migration Source**: `20260119000001_walk_in_queue.sql`

## 1. Schema Analysis

### Columns & Types
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default v4 | Unique Identifier |
| `customer_id` | UUID | FK -> `customers`, Not Null | Links to customer profile |
| `queue_number` | INTEGER | Not Null | Daily running number |
| `status` | ENUM | Default 'waiting' | `waiting`, `called`, `seated`, `cancelled` |
| `party_size` | INTEGER | Check > 0 | Number of people |
| `preferred_machine_id`| UUID | FK -> `machines`, Nullable | Specific machine request |

### Indexes
- `idx_walk_in_queue_status`: Optimized for filtering active vs inactive queues.
- `idx_walk_in_queue_waiting_order`: **Critical** for `rpc_get_waiting_queue` performance.
- `idx_walk_in_queue_joined_at`: For time-based sorting.

## 2. Row Level Security (RLS)

✅ **Enabled**: Yes

| Action | Policy | Security Checks | Verdict |
| :--- | :--- | :--- | :--- |
| **SELECT** | "Walk-in queue is viewable by admins or owners" | `is_moderator_or_admin()` OR `auth.uid() = customer.profile_id` | **SAFE**: Customers see only their own, Admins see all. |
| **INSERT** | "Walk-in queue can be created by admins" | `is_moderator_or_admin()` | **SECURE**: Guests cannot INSERT directly, must use RPC. |
| **UPDATE** | "Walk-in queue can be updated by admins/moderators" | `is_moderator_or_admin()` | **SECURE**: prevents queue manipulation. |
| **DELETE** | "Walk-in queue can be deleted by admins/moderators" | `is_moderator_or_admin()` | **SECURE**. |

## 3. RPC Functions Analysis

### `rpc_join_walk_in_queue` (Public Entry Point)
- **Permissions**: `SECURITY DEFINER` (Bypasses RLS) - Executable by `anon` and `authenticated`.
- **Logic**:
    1. Finds or Creates `customers` by phone number.
    2. Calculates next `queue_number` for today (Atomic-ish via single transaction).
    3. Inserts into `walk_in_queue`.
- **Security Check**:
    - Limits `queue_number` scope to current date.
    - Prevents arbitrary data injection by using strict parameters.
- **Verdict**: ✅ **Safe**. Handles the "Guest User" scenario correctly.

### `rpc_get_waiting_queue` (Public View)
- **Permissions**: Publicly executable.
- **Privacy Handling**: References `mask_phone(c.phone)` to hide customer numbers.
- **Verdict**: ✅ **Safe**. No PII leakage.

### `rpc_call_queue_customer` & `rpc_seat_queue_customer` (Admin Actions)
- **Permissions**: `SECURITY DEFINER` but checks `IF NOT public.is_moderator_or_admin()`.
- **Logic**:
    - Validates Queue Status (`waiting` -> `called` -> `seated`).
    - Validates Machine Availability (for seating).
    - Updates Machine status to `occupied`.
- **Verdict**: ✅ **Robust**. Enforces state machine transitions.

## 4. Integrity & Constraints
- `ON DELETE CASCADE` for `customer_id` ensures no orphaned queue records if a customer is deleted.
- CHECK constraint `party_size > 0` prevents valid-but-nonsensical data.

## 5. Potential Improvements
- **Rate Limiting**: Currently no rate limit on `rpc_join_walk_in_queue`. A spammer could theoretically fill the queue.
    - *Mitigation*: App-level captcha or Supabase Edge Function rate limiting.
