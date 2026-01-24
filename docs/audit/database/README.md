# 🗄️ Database Security & Integrity Audit

This section documents the security analysis of the Supabase PostgreSQL database, focusing on Row Level Security (RLS), Stored Procedures (RPCs), and Data Integrity constraints.

## 📋 Table of Contents

- [**Walk-in Queue System**](./walk_in_structure.md) - Analysis of `walk_in_queue` table and related RPCs.
- [**Session Management**](./sessions_structure.md) - Analysis of `sessions` table (Time tracking & Billing).
- [**Bookings v2**](./bookings_structure.md) - Analysis of the enhanced `bookings` table (Total Price & Check-in).

## 🛡️ General Security Policies

### RLS Strategy
- **Public Tables**: Most tables have RLS enabled.
- **Admin Access**: Uses `is_moderator_or_admin()` function to centralize role checks.
- **Guest Access**: Strictly limited via `rpc_` functions with `SECURITY DEFINER` to bypass RLS in controlled scopes only.

### RPC Strategy
- **SECURITY DEFINER**: Used for public-facing actions (e.g., Joining Queue) to allow unauthenticated users to perform specific writes without granting table-level `INSERT` permissions.
- **Input Validation**: All RPCs validate inputs (e.g., checking if machine matches, if queue is in valid state) before mutation.

---
*Last Updated: 2026-01-24*
