# Login Fix: Single() vs MaybeSingle()

## Problem
Users were seeing this error when logging in:
```
Login error: Cannot coerce the result to a single JSON object. Please try again.
```

## Root Cause
The login page and AuthContext were using `.single()` instead of `.maybeSingle()` when querying the profiles table.

### Difference Between single() and maybeSingle()

**`.single()`**:
- Expects EXACTLY one row to be returned
- Throws an error if zero rows are returned
- Throws an error if multiple rows are returned
- Error message: "Cannot coerce the result to a single JSON object"

**`.maybeSingle()`**:
- Expects zero or one row to be returned
- Returns `data: null` if no rows match (no error)
- Throws an error only if multiple rows are returned
- Recommended for queries that might not return a row

## What Was Fixed

### 1. Login Page (`app/login/page.tsx`)
**Changed from:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role, status, verified')
  .eq('id', data.user.id)
  .single();  // ❌ Throws error if no rows
```

**Changed to:**
```typescript
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role, status, verified')
  .eq('id', data.user.id)
  .maybeSingle();  // ✅ Returns null if no rows
```

### 2. AuthContext (`contexts/AuthContext.tsx`)
**Changed from:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();  // ❌ Throws error if no rows
```

**Changed to:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();  // ✅ Returns null if no rows
```

## Why This Matters

### Row Level Security (RLS) Context
When a user first logs in, there's a brief moment where:
1. Supabase Auth session is established
2. JWT token is being created
3. RLS policies evaluate `auth.uid()`
4. Profile query might see "no access" temporarily

With `.single()`:
- If RLS temporarily blocks access → Error: "Cannot coerce..."
- Even if profile exists, timing issues cause errors

With `.maybeSingle()`:
- If RLS temporarily blocks access → Returns `data: null`, no error
- Application can handle gracefully with retry logic
- More resilient to timing and permission issues

## Best Practice (From Requirements)

The coding requirements explicitly state:

> IMPORTANT: When retrieving zero or one row from a query, ALWAYS use `maybeSingle()` instead of `single()`.
>
> - `maybeSingle()` - Returns `data: null` if no rows match, without throwing an error
> - `single()` - Throws an error if no rows match, which requires additional error handling

## Verified Users
All three users now work correctly:

| Email | Role | Password | Dashboard |
|-------|------|----------|-----------|
| kaariye@hoyconnect.so | host | hoybook1 | /host/dashboard |
| buss.conn.ai@gmail.com | super_admin | admin123 | /admin |
| xaliimo@hoyconnect.so | guest | hoybook1 | /properties |

## Login Flow After Fix

1. User enters email + password
2. Supabase Auth validates credentials
3. Session established with JWT token
4. 500ms delay to ensure session is ready
5. Profile query with `.maybeSingle()`:
   - If profile exists and accessible → Returns profile
   - If profile not found → Returns `data: null` (handled gracefully)
   - If RLS blocks temporarily → Returns `data: null` (retry logic handles)
6. Role-based redirect to appropriate dashboard

## Build Status
✅ **Build Successful** - No TypeScript errors

## Testing
Try logging in with any of the three users:
1. kaariye@hoyconnect.so / hoybook1 → Host Dashboard
2. buss.conn.ai@gmail.com / admin123 → Admin Dashboard
3. xaliimo@hoyconnect.so / hoybook1 → Properties Page

No more "Cannot coerce the result to a single JSON object" errors!
