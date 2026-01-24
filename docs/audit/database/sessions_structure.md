# ⏱️ Database Audit: Sessions & Billing System

**Target Table**: `public.sessions`
**Migration Source**: `20260119000002_sessions.sql`

## 1. Schema Analysis

### Columns & Types
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default v4 | Unique Identifier |
| `station_id` | UUID | FK -> `machines`, Not Null | The machine being used |
| `booking_id` | UUID | FK -> `bookings`, Nullable | Link to advance booking |
| `queue_id` | UUID | FK -> `walk_in_queue`, Nullable | Link to walk-in queue |
| `start_time` | TIMESTAMP | Not Null, Default NOW | Session start |
| `end_time` | TIMESTAMP | Nullable | Session end (NULL = Active) |
| `total_amount`| DECIMAL | Default 0 | Final Calculated Price |
| `payment_status`| ENUM | Default 'unpaid' | `unpaid`, `paid`, `partial` |

### Indexes
- `idx_sessions_active`: WHERE `end_time IS NULL`. **Critical** for preventing double-usage of machines.
- `idx_sessions_station`: For history lookups.

## 2. Row Level Security (RLS)

✅ **Enabled**: Yes

| Action | Policy | Security Checks | Verdict |
| :--- | :--- | :--- | :--- |
| **ALL** | "Sessions are ... by admins/moderators" | `is_moderator_or_admin()` | **STRICT**. Only staff can see/edit sessions. |

**Observation**: Customers cannot see their own session logs directly via table select. They must use specific RPCs if we want to show history (e.g., `rpc_get_my_bookings` works for bookings, but sessions are internal logs).

## 3. RPC Functions Analysis

### `rpc_start_session`
- **Role**: `authenticated` (Admin only check inside).
- **Concurrency Control**:
    - Performs check: `SELECT ... FROM sessions WHERE station_id = ... AND end_time IS NULL`.
    - **Race Condition Risk**: Small window exists between Check and Insert. However, unique index on `(station_id, end_time) WHERE end_time IS NULL` would strictly prevent this at DB level.
    - *Current Implementation*: Relying on Logic check.
- **Side Effects**: Sets Machine Status -> `occupied`.
- **Verdict**: ✅ **Safe** for business logic.

### `rpc_end_session`
- **Role**: `authenticated` (Admin only check inside).
- **Billing Logic**:
    - Calculates `duration_minutes`.
    - Calculates `total_price` = `CEIL(minutes / 60) * hourly_rate`.
    - Allows manual override of `total_amount`.
- **Side Effects**: Sets Machine Status -> `available`.
- **Verdict**: ✅ **Correct**. Flexible for real-world scenarios (discounts/adjustments).

### `rpc_get_session_stats`
- **Role**: `authenticated` (Admin).
- **Performance**: Aggregates data on the fly.
- **Verdict**: ✅ **Safe**. Efficient for dashboard.

## 4. Integrity & Constraints
- `payment_status` ENUM enforces valid states.
- Foreign keys ensure data consistency with Booking/Queue systems.

## 5. Potential Improvements
- **Strict Concurrency**: Add a Partial Unique Index: `CREATE UNIQUE INDEX unique_active_session ON sessions (station_id) WHERE end_time IS NULL;` to mistakenly prevent starting 2 sessions on same machine at DB level.
