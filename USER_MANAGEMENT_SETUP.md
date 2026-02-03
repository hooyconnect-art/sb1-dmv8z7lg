# User Management System - Setup Guide

## Overview

The HoyConnect user management system has been completely rebuilt to ensure users created through the admin panel appear instantly and can log in successfully. All user operations now use server-side actions with proper permissions.

---

## CRITICAL: Required Setup Step

### Get Your Supabase Service Role Key

The service role key is **REQUIRED** for the user management system to work. This key allows server-side operations to bypass RLS restrictions and manage users properly.

**Steps:**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: **Settings** → **API**
3. Find the **service_role** key (secret key)
4. Copy the entire key
5. Open your `.env` file in the project root
6. Replace `your_service_role_key_here` with your actual service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANT:**
- Never commit this key to version control
- Never expose it to the client side
- This key has full admin privileges to your database

---

## How It Works

### User Creation Flow

**Admin Creates Host:**
1. Admin clicks "Create Host User" in Users Management
2. Server action creates user in Supabase Auth using service role
3. Server action immediately creates matching profile record in database
4. Both records are created atomically - if one fails, both are rolled back
5. User appears instantly in the Users Management list
6. Host can immediately log in with their credentials

**Guest Self-Signup:**
1. Guest visits `/signup` page
2. Fills out registration form
3. System creates user in Supabase Auth
4. System creates profile record in database with role='guest'
5. Guest is logged in and redirected to dashboard

### Login Flow

**All Users (Admin, Host, Guest):**
1. User enters credentials at `/login`
2. System authenticates with Supabase Auth
3. System fetches profile from database
4. **Validation checks:**
   - Profile exists in database → If not, login blocked
   - Status is 'active' → If not, login blocked
5. **Role-based redirect:**
   - super_admin / admin → `/admin`
   - host → `/host/dashboard`
   - guest → `/dashboard`

---

## User Management Features

### Create Host User
- Full name, email, phone
- Password (auto-generated or manual)
- Select property types: Hotel, Furnished, Rental
- Set status: Active or Suspended
- Password shown for 10 seconds (copy before closing)

### Edit User
- Update full name
- Update phone number
- Change status (Active/Suspended)
- Modify property types (for hosts)
- Email cannot be changed (security)

### User Status Management
- **Active:** User can log in and use the system
- **Suspended:** User cannot log in, existing sessions terminated
- Click status badge to toggle between Active/Suspended

### Delete User
- Hard delete: Removes from both Auth and database
- Confirmation dialog prevents accidental deletion

### Change User Role
- Dropdown in user table allows role changes
- Roles: guest, host, admin, super_admin
- Changes apply immediately

---

## Database Sync

### Automatic Profile Creation

A database trigger automatically creates profile records when users are created through normal signup:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**However**, for admin-created users, we use server actions to ensure immediate and reliable creation.

### Profile Table Structure

```sql
profiles (
  id UUID PRIMARY KEY,          -- matches auth.users.id
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,                    -- guest, host, admin, super_admin
  status TEXT,                  -- active, suspended, deleted
  property_types TEXT[],        -- for hosts: ['hotel', 'furnished', 'rental']
  verified BOOLEAN,
  created_at TIMESTAMP
)
```

---

## Security

### Row Level Security (RLS)

All tables have RLS enabled with these policies:

1. **Users can view all profiles** - Required for host/guest interactions
2. **Users can update own profile** - Limited to their own record
3. **Super admin can manage all profiles** - Full access for admin operations
4. **Service role can manage profiles** - Required for triggers and server actions

### Password Security

- Minimum 6 characters required
- Passwords are hashed by Supabase Auth (bcrypt)
- Auto-generated passwords use mix of letters, numbers, and symbols
- No passwords stored in plain text

### API Security

- Browser client uses anon key (limited permissions)
- Server actions use service role key (full permissions)
- Service role key never exposed to client
- All admin operations go through server-side validation

---

## User Roles

### Super Admin
- Full system access
- Can manage all users
- Can create/edit/delete any content
- Hardcoded login: buss.conn.ai@gmail.com

### Admin
- Same permissions as super admin
- Created by super admin

### Host
- Can create listings based on assigned property types
- Can manage own listings
- Can view bookings for own properties
- Property types control what they can create

### Guest
- Can browse properties
- Can make bookings
- Can view own bookings
- Self-signup enabled

---

## Troubleshooting

### Users Not Appearing in List

**Check:**
1. Service role key is set in `.env`
2. Server is restarted after adding key
3. No errors in browser console
4. Database connection is working

### Login Fails for Created User

**Check:**
1. User exists in `profiles` table (query database)
2. User status is 'active'
3. Password is correct (case-sensitive)
4. No typos in email

### "Failed to Create User"

**Check:**
1. Service role key is valid
2. Email is not already in use
3. Database connection is working
4. Check server logs for detailed error

### Query to Check Users

```sql
SELECT id, email, full_name, role, status, property_types, created_at
FROM profiles
WHERE status != 'deleted'
ORDER BY created_at DESC;
```

---

## Testing the System

### Test User Creation

1. Login as super admin
2. Go to Admin → Users
3. Click "Create Host User"
4. Fill form with test data
5. Click "Create Host User"
6. **Verify:** User appears immediately in list
7. **Verify:** All data is correct

### Test Host Login

1. Logout from admin
2. Go to login page
3. Enter host credentials
4. Click Sign In
5. **Verify:** Redirects to `/host/dashboard`
6. **Verify:** Dashboard shows host-specific options

### Test Guest Signup

1. Go to `/signup`
2. Fill registration form
3. Click Sign Up
4. **Verify:** Redirects to dashboard
5. **Verify:** User appears in admin users list

### Test Status Suspension

1. In users list, click user's status badge
2. Change to "Suspended"
3. Logout that user (if logged in)
4. Try to login as that user
5. **Verify:** Login blocked with suspension message

---

## API Reference

### Server Actions (app/actions/users.ts)

#### createHostUser(data)
Creates a new host user with Auth and database records.

**Parameters:**
- `email`: string
- `password`: string
- `fullName`: string
- `phone?`: string
- `propertyTypes`: string[]
- `status`: 'active' | 'suspended'

**Returns:**
- `success`: boolean
- `user?`: { id, email, full_name }
- `error?`: string

#### updateUser(data)
Updates existing user profile.

**Parameters:**
- `userId`: string
- `fullName`: string
- `phone?`: string
- `status`: 'active' | 'suspended'
- `propertyTypes?`: string[]

**Returns:**
- `success`: boolean
- `error?`: string

#### deleteUser(userId, hardDelete)
Deletes user (soft or hard delete).

**Parameters:**
- `userId`: string
- `hardDelete`: boolean

**Returns:**
- `success`: boolean
- `error?`: string

#### getAllUsers()
Fetches all users from database.

**Returns:**
- `success`: boolean
- `users`: User[]
- `error?`: string

#### toggleUserStatus(userId, currentStatus)
Toggles user between active and suspended.

**Returns:**
- `success`: boolean
- `newStatus`: string
- `error?`: string

---

## Production Checklist

Before deploying to production:

- [ ] Service role key is set in production environment
- [ ] Service role key is in `.env.local` (not `.env` if using version control)
- [ ] All user creation flows tested
- [ ] Login flows tested for all roles
- [ ] Status suspension tested
- [ ] User editing tested
- [ ] User deletion tested
- [ ] Guest signup tested
- [ ] Password complexity requirements met
- [ ] RLS policies verified in Supabase dashboard
- [ ] Error messages are user-friendly

---

## Architecture Decisions

### Why Server Actions?

Server actions allow us to use the service role key safely on the server side, bypassing RLS restrictions while maintaining security. This ensures:
- Users are created in both Auth and database atomically
- No race conditions between trigger and upsert
- Clear error handling
- Immediate consistency

### Why Not Just Triggers?

Database triggers run with SECURITY DEFINER, but:
- They can't handle complex error cases well
- No way to return meaningful errors to UI
- Can't guarantee atomic operations with Auth
- Limited control over retry logic

### Why Upsert in Server Actions?

Using upsert ensures idempotency:
- If trigger already created profile, upsert updates it
- If trigger failed, upsert creates it
- No duplicate key errors
- Consistent final state

---

## Support

For issues or questions:
1. Check Troubleshooting section above
2. Review server logs
3. Check Supabase dashboard logs
4. Verify database state with SQL queries
