# HoyConnect - Tijaabada Degdeg ah
## Quick Testing Guide - Hagaha Tijaabada Degdega ah

---

## ✅ XAQIIJI IN DHAMMAAN WAX SHAQEEYO

### 1. SUPER ADMIN (buss.conn.ai@gmail.com)

```
Email: buss.conn.ai@gmail.com
Password: admin123
Redirects to: /admin
```

**Tijaabi:**
1. Tag: http://localhost:3000/login
2. Geli email iyo password
3. Riix "Sign In"
4. ✅ Waa inuu ku wareejiyaa: /admin
5. ✅ Waa inaad aragto: Admin dashboard with statistics
6. ✅ Check navbar: "Super Admin" baa ka muuqan doona

**Waxaad ku arki doontaa:**
- Total Users
- Total Listings
- Pending Approvals
- Total Bookings
- Revenue Statistics
- Quick Actions (Manage Users, Review Listings, etc.)

---

### 2. HOST (kaariye@hoyconnect.so)

```
Email: kaariye@hoyconnect.so
Password: hoybook1
Redirects to: /host/dashboard
```

**Tijaabi:**
1. Tag: http://localhost:3000/login
2. Geli email iyo password
3. Riix "Sign In"
4. ✅ Waa inuu ku wareejiyaa: /host/dashboard
5. ✅ Waa inaad aragto: Host dashboard
6. ✅ Check navbar: "Host" baa ka muuqan doona

**Waxaad ku arki doontaa:**
- Overview Tab:
  - Total Bookings
  - Active Listings
  - Total Revenue
  - Available Balance
- Bookings Tab:
  - List of all bookings
  - Booking status
  - Guest information
- Listings Tab:
  - All your listings
  - Edit/Delete options
  - View details
- Wallet Tab:
  - Balance information
  - Transaction history
  - Commission details

---

### 3. GUEST (xaliimo@hoyconnect.so)

```
Email: xaliimo@hoyconnect.so
Password: hoybook1
Redirects to: /properties
```

**Tijaabi:**
1. Tag: http://localhost:3000/login
2. Geli email iyo password
3. Riix "Sign In"
4. ✅ Waa inuu ku wareejiyaa: /properties
5. ✅ Waa inaad aragto: Property listings page
6. ✅ Check navbar: "Guest" baa ka muuqan doona

**Waxaad ku arki doontaa:**
- Search bar
- Property filters
- List of available properties:
  - Hotels
  - Guesthouses
  - Furnished rentals
- Property cards with:
  - Images
  - Price
  - Location
  - Amenities
  - "View Details" button

---

## 🔍 DHIBAATOOYINKA CAADIGA AH

### Dhibaato 1: "Cannot coerce to single JSON object"
**Xalka:** Waa la xaliyay - we now use `.maybeSingle()` instead of `.single()`

### Dhibaato 2: Login success laakiin waa la soo celiyaa login page
**Xalka:**
- Check browser console for errors
- Clear browser cache and cookies
- Try in incognito/private window

### Dhibaato 3: Session wuu ka baxayaa (auto-logout)
**Xalka:** Waa la xaliyay - AuthContext now handles TOKEN_REFRESHED events

### Dhibaato 4: Wrong dashboard after login
**Xalka:**
- Check profile.role in database
- Should be: super_admin, host, or guest
- Login page automatically redirects based on role

---

## 🎯 QUICK COMMANDS

### Clean and Rebuild
```bash
rm -rf .next
npm run build
```

### Check Database Profile
```sql
SELECT id, email, role, status, verified
FROM profiles
WHERE email = 'your-email@example.com';
```

### Check Auth User
```sql
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

---

## 📋 CHECKLIST (Lista Hubin)

### Kabta Login
- [ ] Login page loads correctly
- [ ] Email and password fields work
- [ ] Submit button works
- [ ] Error messages display correctly

### Kabta Super Admin
- [ ] Redirects to /admin
- [ ] Dashboard loads with stats
- [ ] Can access all admin pages
- [ ] Navbar shows "Super Admin"

### Kabta Host
- [ ] Redirects to /host/dashboard
- [ ] Dashboard loads with tabs
- [ ] Can see bookings
- [ ] Can see listings
- [ ] Can see wallet
- [ ] Navbar shows "Host"

### Kabta Guest
- [ ] Redirects to /properties
- [ ] Can see property listings
- [ ] Can search properties
- [ ] Can view property details
- [ ] Navbar shows "Guest"

### Kabta Session
- [ ] Session persists after login
- [ ] Doesn't logout automatically
- [ ] Refresh page keeps you logged in
- [ ] Logout button works

---

## 🚀 SIDEE LOO BILAABIYO

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open Browser
```
http://localhost:3000
```

### 3. Go to Login Page
```
http://localhost:3000/login
```

### 4. Test Each User Type
- Super Admin: buss.conn.ai@gmail.com / admin123
- Host: kaariye@hoyconnect.so / hoybook1
- Guest: xaliimo@hoyconnect.so / hoybook1

---

## 📞 SUPPORT

Haddii wax dhibaato ah ka dhacdo:

1. **Check Browser Console**
   - Right click → Inspect → Console tab
   - Look for red error messages

2. **Check Network Tab**
   - Right click → Inspect → Network tab
   - Look for failed requests (red)

3. **Check Database**
   - Go to Supabase dashboard
   - Check profiles table
   - Check auth.users table

4. **Clear Cache**
   - Close all browser tabs
   - Clear cache and cookies
   - Try again in incognito mode

---

**Status:** ✅ Everything is working correctly
**Last Updated:** January 28, 2026
**Version:** 178

---
