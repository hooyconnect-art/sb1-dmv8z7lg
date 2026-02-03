# Setup Guide for Bolt Environment

## 🚨 Critical Issue: Service Role Key Not Set

You're seeing "Failed to fetch users" because the Supabase service role key is not configured.

---

## 🔧 Solution for Bolt Users

### Step 1: Get Your Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api
2. Scroll to "Project API keys"
3. Find the **service_role** key (it's the longer one, NOT the anon key)
4. Click the copy button

### Step 2: Set Environment Variable in Bolt

In Bolt, you need to set environment variables through the Bolt interface:

1. **Look for the Environment Variables section** in Bolt's settings/configuration
2. **Add this variable:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (paste the service_role key you copied)
3. **Save and redeploy**

**OR**

If Bolt doesn't have a UI for environment variables, you can ask me to help you set it directly in the code (though this is less secure for production).

---

## 🔄 Step 3: Sync User Roles (After Setting Key)

Once the service role key is set, run this command to sync existing user roles:

```bash
node sync-user-roles.js
```

This will migrate all user roles from `user_metadata` (insecure) to `app_metadata` (secure).

---

## 🆘 Alternative: Temporary Workaround

If you can't set environment variables in Bolt right now, I can create a temporary admin interface that:
1. Lets you paste the service role key directly in the browser
2. Syncs all user roles automatically
3. Only works once and doesn't store the key

**Would you like me to create this temporary admin tool?**

---

## 📋 What You Need

**From Supabase Dashboard:**
- Service Role Key: `eyJhbGci...` (starts with eyJ, very long string)

**Where to Find It:**
- https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api
- Section: "Project API keys"
- Look for: "service_role" (secret)

---

## ✅ After Setup

Once configured, you'll be able to:
- ✓ View all users in Admin Dashboard
- ✓ Create new host accounts
- ✓ Manage user roles and permissions
- ✓ Access all admin features

---

## 🔐 Security Note

The service_role key has admin privileges. In production:
- Never expose it in client-side code
- Always use environment variables
- Never commit it to GitHub
