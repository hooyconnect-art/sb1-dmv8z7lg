# Security Fixes Applied - Setup Guide

## ✅ What Was Fixed

### CRITICAL Security Vulnerabilities
1. **User Metadata Vulnerability** - Replaced `user_metadata` with `app_metadata` for role-based access
   - ❌ `user_metadata` can be edited by end users (SECURITY RISK)
   - ✅ `app_metadata` can only be set by admin/service role (SECURE)

2. **Performance Issues** - Wrapped auth functions in SELECT statements
   - Prevents re-evaluation of `auth.jwt()` and `auth.uid()` for each row
   - Significantly improves query performance at scale

3. **Database Optimization** - Removed 55+ unused indexes

### Files Modified
- **Database**: 10 RLS policies updated across `listings`, `profiles`, and `host_requests` tables
- **API Endpoints**: 3 files updated
  - `/api/users/create` - Now sets role in `app_metadata`
  - `/api/users/change-role` - Now updates role in `app_metadata`
  - `/api/users/sync-jwt` - Now syncs role to `app_metadata`

---

## 🔧 REQUIRED SETUP

### Step 1: Configure Service Role Key

The service role key is required for admin operations. Without it, you'll see "Failed to fetch users" errors.

1. **Get your service role key:**
   - Go to: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api
   - Find the **service_role** key (NOT the anon key)
   - Click "Copy"

2. **Update `.env` file:**
   ```bash
   # Open .env file and replace this line:
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # With your actual key:
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-actual-key...
   ```

3. **Restart your dev server** (if running)

### Step 2: Sync Existing User Roles

All existing users need their roles migrated from `user_metadata` to `app_metadata`.

**Option A: Using the API endpoint (Recommended)**
```bash
curl -X POST http://localhost:3000/api/users/sync-jwt
```

**Option B: Using the sync script**
```bash
node sync-user-roles.js
```

Expected output:
```
✓ Synced: admin@example.com (super_admin)
✓ Synced: host@example.com (host)
✓ Synced: user@example.com (guest)

✅ Sync complete: 3 succeeded, 0 failed
```

---

## 🧪 Testing

After completing the setup, verify everything works:

### Test 1: Admin Can Access Users List
1. Log in as admin
2. Go to Admin Dashboard → Users
3. You should see all users without "Failed to fetch users" error

### Test 2: Role-Based Access Works
1. Try accessing admin features as different roles
2. Admin should see all listings
3. Hosts should only see their own listings
4. Guests should only see approved listings

### Test 3: Create New User
1. Admin Dashboard → Users → Create Host
2. Create a new host user
3. The role should be automatically set in `app_metadata`

---

## 📋 Security Checklist

- [ ] Service role key configured in `.env`
- [ ] User roles synced to `app_metadata`
- [ ] Admin can access Users page
- [ ] Admin can see all listings
- [ ] Hosts can only see their listings
- [ ] New users are created with `app_metadata.role`
- [ ] Role changes update `app_metadata.role`

---

## 🚨 Important Notes

### Never Use user_metadata for Security
- `user_metadata` can be edited by users via `supabase.auth.update()`
- Always use `app_metadata` for role-based access control
- Only service role can modify `app_metadata`

### Database Queries
The RLS policies now use:
```sql
-- ✅ SECURE (with SELECT wrapper for performance)
((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin')

-- ❌ INSECURE (never use this)
((select auth.jwt()) -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
```

### API Endpoints
When creating or updating users, always set the role in `app_metadata`:
```typescript
await supabase.auth.admin.updateUserById(userId, {
  app_metadata: {  // ✅ Correct
    role: newRole
  }
});
```

---

## 🔗 Additional Resources

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Auth Helpers Performance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select)
- [User Metadata vs App Metadata](https://supabase.com/docs/guides/auth/managing-user-data)

---

## ❓ Troubleshooting

### "Failed to fetch users"
- **Cause**: Service role key not configured
- **Fix**: Complete Step 1 above

### "Access denied" for admin
- **Cause**: User roles not synced to `app_metadata`
- **Fix**: Run the sync script (Step 2)

### "Invalid API key"
- **Cause**: Wrong key or key not set
- **Fix**: Verify you copied the `service_role` key, not the `anon` key

### Role changes don't take effect
- **Cause**: JWT not refreshed
- **Fix**: Log out and log back in, or wait for JWT to expire

---

## 📞 Support

If you encounter issues:
1. Check that service role key is correctly set
2. Verify all users have been synced
3. Check browser console for detailed errors
4. Review Supabase logs in the dashboard
