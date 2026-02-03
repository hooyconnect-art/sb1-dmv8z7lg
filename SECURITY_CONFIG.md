# Manual Security Configuration Steps

## Overview
Most security issues have been automatically fixed via database migrations. However, two configuration items require manual updates through the Supabase Dashboard.

---

## ✅ Automatically Fixed (Completed)

### 1. Unused Database Indexes - FIXED
All unused indexes have been dropped to improve write performance:
- `idx_properties_host_id`
- `idx_properties_city`
- `idx_bookings_property_id`
- `idx_bookings_guest_id`
- `idx_bookings_dates`
- `idx_reviews_property_id`
- `idx_reviews_booking_id`
- `idx_reviews_guest_id`
- `idx_listings_type`
- `idx_payments_booking_id`
- `idx_host_requests_status`

### 2. Multiple Permissive RLS Policies - FIXED
All RLS policies have been consolidated into single policies with OR conditions:
- **Bookings**: 5 policies → 2 policies
- **Guesthouses**: 2 policies → 1 policy
- **Host Requests**: 2 policies → 1 policy
- **Hotels**: 2 policies → 1 policy
- **Listings**: 4 policies → 2 policies
- **Profiles**: 2 policies → 1 policy
- **Rooms**: 2 policies → 1 policy
- **Waiting List**: 6 policies → 2 policies

---

## 🔧 Manual Configuration Required

### 3. Auth DB Connection Strategy

**Issue**: Auth server uses fixed connection count (10) instead of percentage-based allocation.

**Fix Steps**:
1. Go to Supabase Dashboard
2. Navigate to: **Settings** → **Database** → **Connection Pooling**
3. Find the **Auth** pooler configuration
4. Change from "Fixed" to "Percentage" mode
5. Set percentage to: **10-15%** (recommended)
6. Save changes

**Why this matters**:
- Using percentage-based allocation allows the auth server to scale automatically when you upgrade your database instance
- Fixed allocation means upgrading won't improve auth performance

---

### 4. Leaked Password Protection

**Issue**: Password breach detection is currently disabled.

**Fix Steps**:
1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Policies**
3. Find the setting: **"Password breach detection"** or **"Leaked password protection"**
4. Toggle it to **Enabled**
5. Save changes

**What this does**:
- Checks new passwords against the HaveIBeenPwned database
- Prevents users from using passwords that have been leaked in data breaches
- Significantly improves account security

**Configuration Options**:
- **Enabled**: Recommended for production
- **Reject compromised passwords**: Check this option to block leaked passwords
- **Minimum breach count**: Set to 1 (most secure)

---

## Impact Summary

### Performance Improvements
- ✅ Faster INSERT/UPDATE operations (unused indexes removed)
- ✅ Reduced storage overhead
- ✅ Cleaner database schema

### Security Improvements
- ✅ More predictable access control (consolidated policies)
- ✅ Easier to audit and maintain
- ✅ No unintended privilege escalation risks
- 🔧 Better password security (once manual config completed)
- 🔧 Scalable auth connections (once manual config completed)

---

## Verification

After applying manual configurations, verify the setup:

1. **Test Password Protection**:
   - Try registering with a common password like "password123"
   - Should be rejected if configured correctly

2. **Check Connection Strategy**:
   - Go to Database Settings
   - Confirm Auth pooler shows percentage-based allocation

---

## Notes

- All database migrations have been successfully applied
- Application functionality remains unchanged
- Manual steps are optional but highly recommended for production
- These settings can be updated at any time without affecting existing users
