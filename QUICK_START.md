# Quick Start - User Management Fix

## ⚠️ FOR BOLT USERS: Simple Setup

If you're using Bolt and cannot edit `.env` files, follow these steps:

### ONE SIMPLE STEP:

1. **Get Your Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api
   - Find the **service_role** key (the long one, NOT the anon key!)
   - Click "Copy" to copy the full key

2. **Add It To Your App:**
   - Open this file: `lib/supabase-config.ts`
   - Find this line: `SERVICE_ROLE_KEY: 'your_service_role_key_here',`
   - Replace it with: `SERVICE_ROLE_KEY: 'eyJhbGci...YOUR_ACTUAL_KEY',`
   - Save the file

**That's it!** Your admin dashboard will work automatically.

---

## ⚠️ FOR REGULAR USERS: Environment Variables

If you have access to `.env` files:

1. **Get Your Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api
   - Find the **service_role** key (not the anon key!)
   - Click "Copy" to copy the full key

2. **Add to .env File:**
   - Open the `.env` file in your project root
   - Find the line: `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`
   - Replace `your_service_role_key_here` with your actual key
   - Save the file

3. **Restart Your Server:**
   ```bash
   # Stop your dev server (Ctrl+C)
   # Then restart it
   npm run dev
   ```

**Your .env should look like:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://szdnbrxfwckxceeywewh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ What's Fixed

### Problem 1: Users Not Appearing ✅
**Before:** Admin creates host → User not in list
**After:** Admin creates host → User appears instantly

### Problem 2: Login Fails ✅
**Before:** Host cannot login with valid credentials
**After:** Host can login and redirects to dashboard

---

## 🧪 Test the Fixes

### Test 1: Create a Host User

1. Login as super admin:
   - Email: `buss.conn.ai@gmail.com`
   - Password: `admin123`

2. Go to: **Admin** → **Users**

3. Click: **"Create Host User"**

4. Fill in:
   - Full Name: `Test Host`
   - Email: `testhost@example.com`
   - Phone: (optional)
   - Select at least one property type
   - Keep password auto-generate ON
   - Click **"Create Host User"**

5. **VERIFY:**
   - Success message appears with password
   - User appears immediately in the list
   - User shows role as "host"
   - Property types are displayed

### Test 2: Host Login

1. **Copy the password** from the success message (shows for 10 seconds)

2. **Logout** from super admin

3. Go to: `/login`

4. **Login as the host:**
   - Email: `testhost@example.com`
   - Password: (the one you copied)

5. **VERIFY:**
   - Login succeeds
   - Redirects to `/host/dashboard`
   - Host dashboard displays

### Test 3: Guest Signup

1. Go to: `/signup`

2. Fill the registration form:
   - Full Name: `Test Guest`
   - Email: `testguest@example.com`
   - Phone: (optional)
   - Password: `test123456`
   - Confirm Password: `test123456`

3. Click **"Sign Up"**

4. **VERIFY:**
   - Account created successfully
   - Automatically logged in
   - Redirects to `/dashboard`

5. **Verify in admin:**
   - Login as super admin again
   - Go to Users Management
   - See the new guest in the list

### Test 4: Edit User

1. In Users Management, find any user

2. Click the **Edit** button

3. Change:
   - Name
   - Phone number
   - Status
   - Property types (if host)

4. Click **"Update User"**

5. **VERIFY:**
   - Changes saved
   - User list updates immediately

### Test 5: Suspend User

1. Find any user (not super admin!)

2. Click their **status badge** (should say "Active")

3. **VERIFY:**
   - Badge changes to "Suspended"
   - Color changes to red

4. Try to login as that user

5. **VERIFY:**
   - Login blocked
   - Error: "Your account has been suspended"

---

## 📚 Complete Documentation

- **FIXES_APPLIED.md** - Detailed list of all changes
- **USER_MANAGEMENT_SETUP.md** - Complete system documentation
- **This file** - Quick start guide

---

## ❓ Troubleshooting

### "Failed to create user"

**Check:**
- Service role key is added to `.env`
- Server was restarted after adding key
- Key is valid (copy it again from Supabase dashboard)

### "User not appearing in list"

**Check:**
- Refresh the page
- Check browser console for errors
- Verify database connection in Supabase dashboard

### "Cannot login"

**Check:**
- Email is correct (case-sensitive)
- Password is correct (case-sensitive)
- User status is "active" (not suspended)
- User exists in database

**Query to check:**
```sql
SELECT email, role, status
FROM profiles
WHERE email = 'user@example.com';
```

### "Permission denied" errors

**Check:**
- Service role key is correct
- RLS policies are applied (check migrations)
- User making request has proper role

---

## 🎯 Production Deployment

Before going to production:

1. **Set service role key in production environment**
   - Add to Netlify/Vercel environment variables
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key

2. **Test all flows in production:**
   - Create host user
   - Host login
   - Guest signup
   - Edit user
   - Suspend user

3. **Security checklist:**
   - Service role key NOT in `.env` (use `.env.local`)
   - `.env.local` in `.gitignore`
   - Environment variables set in hosting platform
   - No service role key in client-side code

---

## 🚀 You're All Set!

Once you've added the service role key and restarted your server, the entire user management system will work perfectly:

✅ Create host users → They appear instantly
✅ Hosts can login → Redirect to dashboard
✅ Guests can signup → Self-service registration
✅ Edit users → All fields can be updated
✅ Suspend users → Login blocked immediately
✅ Delete users → Removed from system

---

## 📞 Need Help?

1. Check the troubleshooting section above
2. Review FIXES_APPLIED.md for technical details
3. Check USER_MANAGEMENT_SETUP.md for complete documentation
4. Verify database state with SQL queries
5. Check server logs for detailed errors
