# Supabase Connection Pool Troubleshooting

## Overview
This document describes common issues and solutions for Supabase connection pool exhaustion and client timeout problems in the Racing Simulation Queue application.

## Common Symptoms
1. **Client-side timeout** - Supabase client requests hang or fail to connect
2. **Logout hangs** - User clicks logout but API calls are not fired
3. **Stale connections** - After leaving the page open for a long time, interactions fail
4. **Page refresh fixes it** - Refreshing the page resolves the issue temporarily

## Root Causes

### 1. Module-level Singleton with Side Effects
**Problem:** Exporting `supabase` constant at module level can cause issues:
```typescript
// ❌ Bad pattern
export const supabase = createClient();
```

**Solution:** Use lazy initialization with proper singleton pattern:
```typescript
// ✅ Good pattern
let clientInstance: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (clientInstance) return clientInstance;
  clientInstance = createBrowserClient(...);
  return clientInstance;
}
```

### 2. Visibility-unaware Polling
**Problem:** Auto-refresh intervals continue when tab is hidden, wasting connections.

**Solution:** Check visibility before making requests:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      refreshData();
    }
  }, 30000);
  return () => clearInterval(interval);
}, [refreshData]);
```

### 3. Stale Connection Recovery
**Problem:** After long idle periods, the Supabase client may have stale connections.

**Solution:** Add visibility change handler to refresh stale connections:
```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    const timeSinceActivity = Date.now() - lastActivityTime;
    if (timeSinceActivity > 5 * 60 * 1000) { // 5 minutes
      supabase.auth.getSession(); // Health check
    }
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
```

## Configuration Recommendations

### Supabase Dashboard Settings
1. Navigate to your project settings
2. Under **Database > Connection Pooling**:
   - Use **Transaction Mode** for serverless (Vercel)
   - Set appropriate pool size (default: 15)
3. Use the **Supavisor Pooler URL** for client-side connections

### Environment Variables
```env
# Use Transaction Pooler for client (port 6543)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Use Session Pooler or Direct for server-side (port 5432)
SUPABASE_DB_URL=postgresql://...
```

## Debug Commands

### Check Active Connections
In browser console:
```javascript
// Import and call debug function
import { logActiveConnections } from '@/src/infrastructure/supabase/client';
logActiveConnections();
```

### Supabase Dashboard
Monitor connections in: **Database > Overview > Active connections**

## Best Practices

1. **Use `createClient()` function** - Never import module-level constants
2. **Implement AbortController** - Cancel pending requests on unmount
3. **Add visibility checks** - Stop polling when tab is hidden
4. **Use proper cleanup** - Clean up intervals and listeners in useEffect return
5. **Cache repository instances** - Avoid creating multiple auth listeners

## Files Modified for Connection Optimization
- `src/infrastructure/supabase/client.ts` - Main singleton with visibility management
- `src/presentation/presenters/auth/AuthPresenterClientFactory.ts` - Cached repository
- All `*ClientFactory.ts` files - Using `createClient()` instead of module-level import

## Related Documentation
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Vercel + Supabase Best Practices](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
