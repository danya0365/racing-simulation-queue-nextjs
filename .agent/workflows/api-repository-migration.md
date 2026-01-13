---
description: Refactor client-side repositories to use API routes instead of direct Supabase connection
---

# Client-side API Repository Migration

## Overview
This workflow migrates all client-side presenter factories from using `Supabase*Repository` 
to `Api*Repository` to resolve connection pool exhaustion issues.

## Important Notes
- **Auth**: Keep using Supabase Auth directly - DO NOT migrate to API
- **Server Factories**: No changes needed - they work correctly
- **Single Source of Truth**: Types are shared via existing interfaces in `src/application/repositories/`

## Phase 1: Foundation - Machines API
// turbo-all

### 1.1 Create API Route for Machines
```bash
# Create directory
mkdir -p app/api/machines/[id]
```

### 1.2 Implement `/app/api/machines/route.ts`
- GET: Get all machines
- POST: Create machine (admin only)

### 1.3 Implement `/app/api/machines/[id]/route.ts`
- GET: Get machine by ID
- PUT: Update machine
- DELETE: Delete machine

### 1.4 Create `src/infrastructure/repositories/api/ApiMachineRepository.ts`
Implement `IMachineRepository` interface using fetch

### 1.5 Test with `BackendPresenterClientFactory`

---

## Phase 2: Queues API

### 2.1 Create API Routes for Queues
- `/app/api/queues/route.ts` - GET all, POST create
- `/app/api/queues/[id]/route.ts` - GET, PUT, DELETE by ID
- `/app/api/queues/search/route.ts` - Search by phone
- `/app/api/queues/stats/route.ts` - Get stats

### 2.2 Create `ApiQueueRepository.ts`

### 2.3 Update Client Factories:
- `BackendPresenterClientFactory`
- `HomePresenterClientFactory`
- `CustomerPresenterClientFactory`
- `BookingWizardPresenterClientFactory`
- `QueueStatusPresenterClientFactory`
- `SingleQueuePresenterClientFactory`

---

## Phase 3: Advance Bookings API

### 3.1 Create API Routes
- `/app/api/advance-bookings/route.ts`
- `/app/api/advance-bookings/[id]/route.ts`
- `/app/api/advance-bookings/schedule/route.ts`
- `/app/api/advance-bookings/by-phone/route.ts`

### 3.2 Create `ApiAdvanceBookingRepository.ts`

### 3.3 Update Client Factories:
- `AdvanceBookingPresenterClientFactory`
- `QuickAdvanceBookingPresenterClientFactory`

### 3.4 Update `RepositoryFactory.ts`

---

## Phase 4: Customers API

### 4.1 Create API Routes
- `/app/api/customers/route.ts`
- `/app/api/customers/[id]/route.ts`

### 4.2 Create `ApiCustomerRepository.ts`

### 4.3 Update `CustomersPresenterClientFactory`

---

## Phase 5: Cleanup

### 5.1 Remove unused imports from client factories
### 5.2 Update documentation
### 5.3 Verify all client factories use API repositories
### 5.4 Test all pages

---

## Files to Skip (Keep Supabase)
- `AuthPresenterClientFactory.ts` - Uses Supabase Auth directly
- `ProfilePresenterClientFactory.ts` - Uses Auth repository

## Testing Checklist
- [ ] Backend dashboard loads
- [ ] Home page loads
- [ ] Quick booking works
- [ ] Advance booking works
- [ ] Customer list works
- [ ] Queue search works
- [ ] No Supabase connection errors after idle
