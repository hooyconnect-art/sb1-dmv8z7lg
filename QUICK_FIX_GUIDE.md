# Quick Fix: "Invalid API Key" Error

## ⚡ ONE STEP TO FIX

The error happens because `.env` has a placeholder service role key. You need to add the real key.

---

## 🔑 Add Your Service Role Key

### 1. Get the Key

Go to: **https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api**

Copy the **service_role** key (NOT the anon key)

### 2. Update .env

Open `.env` and replace:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

With:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
(Paste your actual key)

### 3. Restart Server

```bash
npm run dev
```

---

## ✅ Test It Works

1. Login: `buss.conn.ai@gmail.com` / `admin123`
2. Go to: **Admin → Users**
3. Click **"Create Host User"**
4. Fill the form and submit

**Expected:** User created successfully ✅

---

## 📋 What Was Fixed

✅ **NO Server Actions** - Uses API Routes instead
✅ **NO Build Errors** - Builds successfully
✅ **Clear Error Messages** - Tells you exactly what's wrong
✅ **Smart Validation** - Detects placeholder keys
✅ **All CRUD Works** - Create, read, update, delete users
✅ **Scoped to Project** - Only HoyConnect-accommoda changed

---

## 🔒 Security

Service role key is **NEVER exposed** to browser:
- Only used in API routes (server-side)
- Never sent to client
- Build output shows `λ` (server-only)

---

## 🐛 Still Having Issues?

### If you see "Service role key not configured":
→ Add the key to `.env` (see Step 1-3 above)

### If you see "Failed to create user":
→ Verify you copied the **service_role** key (not anon key)

### If user doesn't appear in list:
→ Refresh the page

### If login fails:
→ Check user status is "active" in Users list

---

## 📚 Full Documentation

See `FIX_INVALID_API_KEY.md` for complete details.

---

## ✨ That's It!

Just add the service role key and everything will work!
