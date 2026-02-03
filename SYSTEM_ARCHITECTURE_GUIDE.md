# HOYCONNECT - System Architecture & Sida Uu U Shaqeeyo

> **Comprehensive Guide** - Sharaxaad buuxda oo ku saabsan sida system-kan loo dhisay iyo sida uu u shaqeeyo

---

## 📋 TABLE OF CONTENTS

1. [System Overview - Guud Ahaan System-ka](#1-system-overview)
2. [Database Architecture - Qaab-dhismeedka Database](#2-database-architecture)
3. [Authentication & Security - Nidaamka Amniga](#3-authentication--security)
4. [User Roles & Permissions - Doorarka Isticmaalayaasha](#4-user-roles--permissions)
5. [Core Features - Shaqooyinka Muhiimka Ah](#5-core-features)
6. [Data Flow - Socodka Xogta](#6-data-flow)
7. [Known Issues & Solutions - Dhibaatooyinka iyo Xalka](#7-known-issues--solutions)

---

## 1. SYSTEM OVERVIEW

### Maxaa HoyConnect?

HoyConnect waa **property management & booking platform** loogu talagalay Somalia. Waxay u oggolaataa:

- **Martida (Guests)**: In ay raadiyaan oo ay buugsan karaan hotels, guesthouses, iyo guryaha la kiraystay
- **Hosts**: In ay soo geliyaan guryahooda ama hotels-kooda si loogu kiraystay ama loogu buugsan karo
- **Admins**: In ay maamulaan dhammaan bookings, listings, payments, iyo users

### Tech Stack

```
Frontend:  Next.js 13 (App Router) + React + TypeScript + Tailwind CSS
Backend:   Supabase (PostgreSQL + Auth + Storage + RLS)
Hosting:   Netlify
Auth:      Supabase Auth (Email/Password)
Storage:   Supabase Storage (Images)
```

### System Type

- **Multi-tenant Platform**: Multiple users with different roles
- **Role-Based Access Control (RBAC)**: 4 roles - guest, host, admin, super_admin
- **Real-time Database**: Supabase PostgreSQL + Row Level Security (RLS)

---

## 2. DATABASE ARCHITECTURE

### 2.1 CORE TABLES (Miisaska Muhiimka Ah)

#### A. **profiles** - User Accounts
```sql
Purpose: Waxay keydisaa dhammaan macluumaadka users
Columns:
  - id (UUID) → Links to auth.users.id
  - full_name (text) → Magaca user-ka
  - email (text) → Email address
  - phone (text) → Telephone number
  - role (text) → 'guest' | 'host' | 'admin' | 'super_admin'
  - status (text) → 'active' | 'suspended' | 'deleted'
  - verified (boolean) → Ma la xaqiijiyay?
  - property_types (text[]) → Noocyada guryaha ee host-ku leeyahay
  - is_active (boolean) → Ma firfircoon yahay?

RLS Policies:
  ✅ Users can view their own profile
  ✅ Admins can view all profiles
  ✅ Users can update their own profile
  ✅ Only admins can change roles
```

**Cilad Halkan Ka Dhici Karta:**
- User sign up markuu dhaco, haddii profile auto-create-gu fashilmo
- Role change markuu dhaco, JWT-ga ma isbeddela si degdeg ah
- Status change marka la sameeyo, user-ku wali geli karaa system-ka

---

#### B. **listings** - Property Listings
```sql
Purpose: Waxay keydisaa dhammaan guryaha iyo hotels-ka la soo gelinayo

Columns:
  - id (UUID)
  - host_id (UUID) → Links to profiles.id
  - listing_type (text) → 'hotel' | 'fully_furnished' | 'rental'
  - approval_status (text) → 'pending' | 'approved' | 'rejected'
  - is_active (boolean)
  - is_available (boolean)
  - is_featured (boolean)
  - commission_rate (numeric) → Percentage for commission
  - approved_by (UUID) → Which admin approved
  - approved_at, rejected_at, rejection_reason

RLS Policies:
  ✅ Hosts can create listings
  ✅ Hosts can view their own listings
  ✅ Public can view approved & active listings
  ✅ Admins can view all listings
  ✅ Only admins can approve/reject
```

**Relationship:**
- 1 Listing → 1 Hotel (if listing_type = 'hotel')
- 1 Listing → 1 Guesthouse (if listing_type = 'fully_furnished' or 'rental')

**Cilad Halkan Ka Dhici Karta:**
- Listing marka la approve gareyo, is_active automatically ma noqoto true
- Guests waxay arki karaan listings that are approved=true + is_active=true + is_available=true
- Haddii mid ka maqan yahay, listing-ku ma muuqan doonto

---

#### C. **hotels** - Hotel Details
```sql
Purpose: Macluumaadka hotel-ka (name, address, amenities, etc)

Columns:
  - id (UUID)
  - listing_id (UUID) → Links to listings.id (UNIQUE)
  - name (text)
  - city (text)
  - address (text)
  - description (text)
  - rating (1-5)
  - amenities (text[]) → ['WiFi', 'Parking', 'Pool']
  - check_in_time, check_out_time
  - images (text[]) → Array of image URLs

RLS Policies:
  ✅ Inherits from listings table
  ✅ Public read for approved listings
```

**Relationship:**
- 1 Hotel → Many Rooms

---

#### D. **rooms** - Hotel Rooms
```sql
Purpose: Qolalka hotel-ka (room types, prices, availability)

Columns:
  - id (UUID)
  - hotel_id (UUID) → Links to hotels.id
  - room_type (text) → 'single' | 'double' | 'suite' | 'deluxe'
  - price_per_night (numeric)
  - max_guests (integer)
  - quantity (integer) → Immisa qol oo noocaas ah
  - amenities (text[])
  - images (text[])

RLS Policies:
  ✅ Public can view rooms of approved hotels
  ✅ Hosts can manage their hotel rooms
```

**Cilad Halkan Ka Dhici Karta:**
- Room availability ma laha dedicated column
- System-ku ma check gareyso quantity available vs bookings
- Possible double-booking

---

#### E. **guesthouses** - Guesthouses/Apartments
```sql
Purpose: Guryaha la kiraynayo (houses, apartments, villas)

Columns:
  - id (UUID)
  - listing_id (UUID) → Links to listings.id (UNIQUE)
  - title (text)
  - property_type (text) → 'house' | 'apartment' | 'villa' | 'guesthouse'
  - city, address, description
  - price_type (text) → 'night' | 'month'
  - price (numeric)
  - bedrooms, bathrooms, max_guests
  - amenities (text[])
  - images (text[])

RLS Policies:
  ✅ Inherits from listings table
```

---

#### F. **bookings** - Booking Records
```sql
Purpose: Dhammaan bookings-ka customers-ka

Columns:
  - id (UUID)
  - guest_id (UUID) → Who booked
  - listing_id (UUID) → What listing
  - room_id (UUID) → Which room (if hotel)
  - booking_type (text) → 'listing' | 'property'
  - check_in, check_out (dates)
  - num_guests (integer)
  - total_price (numeric)
  - commission_amount (numeric) → Auto-calculated
  - status (text) → 'pending' | 'confirmed' | 'cancelled' | 'completed'
  - payment_status (text) → 'pending' | 'paid' | 'refunded' | 'failed'
  - payment_method (text)
  - property_type (text) → For commission calculation

RLS Policies:
  ✅ Guests can view their own bookings
  ✅ Hosts can view bookings for their listings
  ✅ Admins can view all bookings
```

**Commission Logic:**
- Commission waxaa lagu xisaabiyaa based on `property_type`
- Auto-calculated using `calculate_booking_commission()` function
- Stored in `commission_amount` column

**Cilad Halkan Ka Dhici Karta:**
- Double booking - system-ku ma check gareyso room availability
- Commission rate change markuu dhaco, existing bookings ma isbeddelaan
- Payment status manual laga beddelaa

---

#### G. **payments** - Payment Records
```sql
Purpose: Dhammaan lacag bixintii

Columns:
  - id (UUID)
  - booking_id (UUID) → Links to bookings.id
  - business_id (UUID) → Who gets paid (host)
  - amount (numeric)
  - payment_method (text) → 'evc_plus' | 'edahab' | 'sahal' | 'cash'
  - payment_status (text) → 'pending' | 'completed' | 'failed' | 'refunded'
  - transaction_id (text)
  - paid_at (timestamp)

RLS Policies:
  ✅ Users can view their own payment records
  ✅ Admins can view all payments
```

**Cilad Halkan Ka Dhici Karta:**
- Ma jiro automated payment gateway integration
- All payments manual la gala
- No automatic payment verification

---

#### H. **commission_settings** - Commission Rates
```sql
Purpose: Commission rates oo property type kasta u gaar ah

Columns:
  - id (UUID)
  - property_type (text) → 'hotel' | 'fully_furnished' | etc
  - commission_rate (numeric) → Percentage (e.g., 10.00 = 10%)
  - is_active (boolean)
  - description (text)

Data:
  - hotel: 10%
  - fully_furnished: 8%
  - rental: 5%
  - property_sales: 3%

RLS Policies:
  ✅ Public can read commission settings
  ✅ Only super_admin can modify
```

---

#### I. **host_requests** - Host Applications
```sql
Purpose: Applications from guests who want to become hosts

Columns:
  - id (UUID)
  - user_id (UUID)
  - full_name, phone, property_type, location
  - status (text) → 'pending' | 'approved' | 'rejected'

RLS Policies:
  ✅ Users can create host requests
  ✅ Users can view their own requests
  ✅ Admins can view all requests
```

**Flow:**
1. Guest submits host request → status='pending'
2. Admin reviews request → approves or rejects
3. If approved → admin manually changes user role to 'host'

**Cilad:**
- Ma jiro automatic role change after approval
- Admin manually waa in uu role-ka beddelaa

---

#### J. **property_sales** - Properties for Sale
```sql
Purpose: Guryaha loo iibinayo (land, houses, etc)

Columns:
  - id (UUID)
  - seller_id (UUID)
  - title, description
  - property_type (text) → 'land' | 'house' | 'apartment' | 'commercial'
  - price (numeric)
  - size_sqm, bedrooms, bathrooms
  - city, address
  - features, images
  - status (text) → 'active' | 'pending' | 'sold' | 'withdrawn'
  - is_featured (boolean)
  - views_count (integer)

RLS Policies:
  ✅ Public can view active properties
  ✅ Sellers can manage their properties
  ✅ Admins can manage all properties
```

---

### 2.2 VIEWS (Database Views)

#### **inquiry_listings**
```sql
Purpose: Approved listings oo inquiry-only (rentals)
Security: SECURITY INVOKER (runs with caller permissions)
Filters: approval_status='approved' AND is_active=true
```

#### **bookable_listings**
```sql
Purpose: Listings that can be booked online (hotels, fully_furnished)
Security: SECURITY INVOKER (runs with caller permissions)
Filters: approval_status='approved' AND is_active=true AND is_available=true
```

**Security:** Labada view waxay isticmaalayaan **SECURITY INVOKER** - maxaa ka dhigan?
- Views run with the **caller's permissions** (not elevated)
- Access controlled by RLS policies on underlying tables
- No security vulnerabilities

---

### 2.3 STORAGE BUCKETS

```
Supabase Storage Buckets:
  - listing-images/     → Images for listings
  - room-images/        → Images for hotel rooms
  - property-images/    → Images for property sales
  - avatars/           → User profile pictures

Security:
  - Public read access for approved listings
  - Upload restricted to authenticated users
  - File size limits enforced
```

---

## 3. AUTHENTICATION & SECURITY

### 3.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. USER SIGNUP (Guest)
   ↓
   Frontend: /signup page
   ↓
   Supabase Auth: signUp(email, password)
   ↓
   auth.users table: New user created
   ↓
   TRIGGER: handle_new_user() [SECURITY DEFINER]
   ↓
   - Auto-creates profile in public.profiles
   - Sets role = 'guest' (default)
   - Sets raw_app_meta_data.role = 'guest'
   - Auto-confirms email (no verification needed)
   ↓
   JWT Token: Issued with role='guest'
   ↓
   User can login ✅

2. USER LOGIN
   ↓
   Frontend: /login page
   ↓
   Supabase Auth: signInWithPassword(email, password)
   ↓
   JWT Token: Issued with current role
   ↓
   AuthContext: Stores user session
   ↓
   Redirects based on role:
   - guest → /dashboard
   - host → /host/dashboard
   - admin → /admin
   - super_admin → /admin

3. ROLE CHANGE (Admin Action)
   ↓
   Admin: Changes user role in profiles table
   ↓
   TRIGGER: sync_profile_role_to_jwt() [SECURITY DEFINER]
   ↓
   - Updates auth.users.raw_app_meta_data.role
   - User must re-login for changes to take effect
   ↓
   New JWT: Issued with new role on next login
```

### 3.2 Security Model

#### Row Level Security (RLS)

**Dhammaan tables waxay leeyihiin RLS ENABLED ✅**

```sql
Example: profiles table RLS policies

1. "Users can read own profile"
   USING (auth.uid() = id)

2. "Admins can read all profiles"
   USING (
     (SELECT role FROM profiles WHERE id = auth.uid())
     IN ('admin', 'super_admin')
   )

3. "Users can update own profile"
   USING (auth.uid() = id)
   WITH CHECK (auth.uid() = id)

4. "Only admins can change roles"
   (Role column has special protection)
```

#### Security Definer Functions

**Waxaa jira functions that run with SECURITY DEFINER (elevated privileges):**

```sql
Functions with SECURITY DEFINER:
1. handle_new_user() - Auto-create profile on signup
2. sync_profile_role_to_jwt() - Sync role to JWT
3. sync_user_role_to_jwt() - Admin tool to sync roles
4. calculate_booking_commission() - Calculate commissions
5. update_*_updated_at() - Trigger functions
```

**Maxay u baahan yihiin SECURITY DEFINER?**
- They need to access `auth.users` table (restricted schema)
- They need to update JWT metadata
- They run safely with explicit security checks

**Security Concerns:**
⚠️ Haddii function yahay SECURITY DEFINER:
- Must have explicit `SET search_path = public, pg_temp`
- Must validate all inputs
- Must check permissions explicitly
- Should be minimal and focused

---

### 3.3 JWT Structure

```json
{
  "aud": "authenticated",
  "exp": 1234567890,
  "sub": "user-uuid-here",
  "email": "user@example.com",
  "app_metadata": {
    "provider": "email",
    "role": "guest"  ← ROLE STORED HERE
  },
  "user_metadata": {
    "full_name": "John Doe"
  },
  "role": "authenticated"
}
```

**How to Access Role in RLS Policies:**
```sql
(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'

OR

(SELECT role FROM profiles WHERE id = auth.uid())
```

**Cilad Halkan:**
⚠️ JWT ma isbeddelo automatically marka role la beddelo
⚠️ User waa in uu re-login sameeyo si JWT cusub u helo
⚠️ This causes delays in permission changes

---

## 4. USER ROLES & PERMISSIONS

### 4.1 Role Hierarchy

```
super_admin (Highest authority)
    ↓
admin (Full management access)
    ↓
host (Can create listings)
    ↓
guest (Basic user - default)
```

### 4.2 Permission Matrix

| Feature | Guest | Host | Admin | Super Admin |
|---------|-------|------|-------|-------------|
| **Authentication** |
| Sign up | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ | ✅ |
| **Browsing** |
| View listings | ✅ | ✅ | ✅ | ✅ |
| Search properties | ✅ | ✅ | ✅ | ✅ |
| View property details | ✅ | ✅ | ✅ | ✅ |
| **Booking** |
| Create booking | ✅ | ✅ | ✅ | ✅ |
| View own bookings | ✅ | ✅ | ✅ | ✅ |
| Cancel booking | ✅ | ✅ | ✅ | ✅ |
| **Hosting** |
| Apply to be host | ✅ | ❌ | ❌ | ❌ |
| Create listings | ❌ | ✅ | ✅ | ✅ |
| Manage own listings | ❌ | ✅ | ✅ | ✅ |
| View bookings for listings | ❌ | ✅ | ✅ | ✅ |
| **Admin** |
| View all users | ❌ | ❌ | ✅ | ✅ |
| Create users | ❌ | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ | ✅ |
| Suspend users | ❌ | ❌ | ✅ | ✅ |
| Approve/reject listings | ❌ | ❌ | ✅ | ✅ |
| View all bookings | ❌ | ❌ | ✅ | ✅ |
| Manage payments | ❌ | ❌ | ✅ | ✅ |
| View analytics | ❌ | ❌ | ✅ | ✅ |
| **Super Admin Only** |
| Manage commission rates | ❌ | ❌ | ❌ | ✅ |
| Delete users permanently | ❌ | ❌ | ❌ | ✅ |
| Access system settings | ❌ | ❌ | ❌ | ✅ |
| Manage admins | ❌ | ❌ | ❌ | ✅ |

### 4.3 Role Assignment

**Default Role:** `guest` (automatic on signup)

**How to Change Roles:**

1. **Guest → Host:**
   - Option A: Guest applies via "Become a Host" form
   - Admin reviews and approves
   - Admin manually changes role in admin panel

   - Option B: Admin directly changes role

2. **Any → Admin:**
   - Only super_admin can create admins
   - Done via admin panel: `/admin/users`

3. **Admin → Super Admin:**
   - Only existing super_admin can promote
   - Typically done via direct database access

---

## 5. CORE FEATURES

### 5.1 Listings Management

**Create Listing Flow:**

```
1. Host navigates to: /host/listings/new
   ↓
2. Selects listing type:
   - Hotel → /host/listings/new/hotel
   - Guesthouse → /host/listings/new/guesthouse
   ↓
3. Fills form:
   - Basic info (name, location, description)
   - Pricing
   - Amenities
   - Images (upload to Supabase Storage)
   ↓
4. Submits form
   ↓
5. Backend creates:
   - listings table entry (status='pending', approval_status='pending')
   - hotels OR guesthouses table entry
   - rooms entries (if hotel)
   ↓
6. Admin reviews in: /admin/listings
   ↓
7. Admin can:
   - Approve → approval_status='approved', is_active=true
   - Reject → approval_status='rejected', rejection_reason set
   ↓
8. If approved:
   - Listing appears in public search
   - Available for booking (if is_available=true)
```

**Cilad Halkan:**
⚠️ is_active ma isbeddelo automatically marka la approve gareyo
⚠️ Host manually waa in uu is_active = true sameeyo
⚠️ Ama admin waa in uu manual u beddelo

---

### 5.2 Booking Flow

```
1. Guest searches for properties
   ↓
2. Views listing details: /listings/[id]
   ↓
3. Selects dates & number of guests
   ↓
4. System checks:
   - Is listing available?
   - Is room available? (if hotel)
   ⚠️ NO ACTUAL AVAILABILITY CHECK IMPLEMENTED
   ↓
5. Creates booking:
   - booking_type = 'listing'
   - status = 'pending'
   - payment_status = 'pending'
   - Calculates commission_amount
   ↓
6. Payment screen (manual process)
   ↓
7. Admin confirms payment
   ↓
8. Booking status → 'confirmed'
```

**Commission Calculation:**

```javascript
commission_amount = total_price * (commission_rate / 100)

Example:
- Hotel booking: $100
- Commission rate: 10%
- Commission amount: $100 * 0.10 = $10
- Host receives: $90
- Platform receives: $10
```

---

### 5.3 Payment Processing

**Current State: MANUAL**

```
1. Guest creates booking
   ↓
2. Payment status = 'pending'
   ↓
3. Guest pays via:
   - EVC Plus
   - E-Dahab
   - Sahal
   - Cash
   ↓
4. Guest provides transaction ID
   ↓
5. Admin manually verifies payment
   ↓
6. Admin updates:
   - payment_status = 'completed'
   - paid_at = now()
   ↓
7. Booking confirmed
```

**Cilad:**
⚠️ Ma jiro automated payment gateway
⚠️ Everything is manual
⚠️ Risk of errors and fraud

---

### 5.4 Commission System

**How It Works:**

```sql
-- Commission settings stored in commission_settings table
property_type    | commission_rate
-----------------+----------------
hotel           | 10.00
fully_furnished | 8.00
rental          | 5.00
property_sales  | 3.00

-- When booking is created:
1. System looks up commission_rate based on property_type
2. Calculates: commission_amount = total_price * (rate / 100)
3. Stores in bookings.commission_amount
4. Admin can view commission analytics in /admin/commission
```

**Commission Analytics:**
- Total commissions per property type
- Total commissions per time period
- Top earning properties
- Commission trends

---

## 6. DATA FLOW

### 6.1 User Signup → Login → Booking

```
┌──────────────────────────────────────────────────────────┐
│                   COMPLETE USER JOURNEY                   │
└──────────────────────────────────────────────────────────┘

STEP 1: SIGNUP
  User → /signup
  Frontend: Submits (email, password, full_name)
  ↓
  supabase.auth.signUp()
  ↓
  auth.users table: User created
  ↓
  TRIGGER: handle_new_user()
    - Creates profile (role='guest')
    - Sets JWT metadata
    - Auto-confirms email
  ↓
  User receives JWT token
  ↓
  Redirects to /dashboard

STEP 2: BROWSE LISTINGS
  User → /properties
  ↓
  Query: SELECT * FROM listings
         WHERE approval_status='approved'
         AND is_active=true
  ↓
  RLS: Public can read approved listings ✅
  ↓
  Display results

STEP 3: VIEW LISTING DETAILS
  User clicks listing
  ↓
  Navigate to: /listings/[id]
  ↓
  Query: SELECT listing, hotel, rooms
         WHERE listing.id = [id]
  ↓
  RLS: Public read ✅
  ↓
  Display full details + booking form

STEP 4: CREATE BOOKING
  User fills form:
    - Check-in date
    - Check-out date
    - Number of guests
    - Room selection (if hotel)
  ↓
  Frontend: Calculate total_price
  ↓
  Submit booking
  ↓
  Backend:
    1. INSERT INTO bookings (
         guest_id = auth.uid(),
         listing_id = [id],
         room_id = [room_id],
         check_in, check_out,
         num_guests,
         total_price,
         status = 'pending',
         payment_status = 'pending'
       )
    2. TRIGGER: set_booking_commission()
       - Looks up commission_rate
       - Calculates commission_amount
       - Updates booking
  ↓
  RLS: Guest can insert their own booking ✅
  ↓
  Booking created

STEP 5: PAYMENT (MANUAL)
  Guest pays via mobile money
  ↓
  Guest provides transaction ID to admin
  ↓
  Admin verifies payment
  ↓
  Admin updates:
    payment_status = 'completed'
    booking_status = 'confirmed'
  ↓
  Guest receives confirmation

STEP 6: VIEW BOOKINGS
  User → /dashboard
  ↓
  Query: SELECT * FROM bookings
         WHERE guest_id = auth.uid()
  ↓
  RLS: User can read own bookings ✅
  ↓
  Display booking history
```

---

### 6.2 Host Creates Listing

```
STEP 1: BECOME HOST (If user is guest)
  User → /host/register
  ↓
  Submit host_requests form
  ↓
  INSERT INTO host_requests (
    user_id, full_name, phone,
    property_type, location,
    status = 'pending'
  )
  ↓
  Admin reviews in /admin/waiting-list
  ↓
  Admin approves request
  ↓
  Admin manually changes user role:
    UPDATE profiles
    SET role = 'host'
    WHERE id = [user_id]
  ↓
  TRIGGER: sync_profile_role_to_jwt()
    - Updates auth.users.raw_app_meta_data
  ↓
  User re-logins → Now has 'host' role

STEP 2: CREATE LISTING
  Host → /host/listings/new
  ↓
  Selects type: Hotel or Guesthouse
  ↓
  HOTEL PATH:
    Host → /host/listings/new/hotel
    ↓
    Fills form:
      - Hotel name, city, address
      - Description, amenities
      - Check-in/out times
      - Upload images
      - Add rooms:
        - Room type, price, quantity
        - Room amenities, images
    ↓
    Submit
    ↓
    Backend Transaction:
      1. INSERT INTO listings (
           host_id = auth.uid(),
           listing_type = 'hotel',
           approval_status = 'pending',
           is_active = false
         ) RETURNING id
      2. INSERT INTO hotels (
           listing_id = [new_listing_id],
           name, city, address, ...
         )
      3. FOR each room:
           INSERT INTO rooms (
             hotel_id = [new_hotel_id],
             room_type, price, ...
           )
      4. Upload images to Supabase Storage
      5. Update hotels.images array
    ↓
    RLS: Host can insert own listings ✅
    ↓
    Success → Listing created (pending approval)

  GUESTHOUSE PATH:
    Similar to hotel but simpler
    Creates: listings + guesthouses

STEP 3: ADMIN APPROVAL
  Admin → /admin/listings
  ↓
  Views all pending listings
  ↓
  Reviews listing details
  ↓
  Option A: APPROVE
    - Sets approval_status = 'approved'
    - Sets is_active = true
    - Sets approved_by = admin_id
    - Sets approved_at = now()
  ↓
  Option B: REJECT
    - Sets approval_status = 'rejected'
    - Sets rejection_reason
    - Sets rejected_at = now()
  ↓
  If approved:
    Listing now visible to public ✅
```

---

### 6.3 Admin User Management

```
Admin → /admin/users
↓
View all users (paginated)
↓
Search/filter users by:
  - Role
  - Status
  - Email
  - Date joined
↓
Select user → Actions:

1. CHANGE ROLE
   ↓
   API: POST /api/users/change-role
   ↓
   Verify admin permissions
   ↓
   UPDATE profiles SET role = [new_role]
   ↓
   TRIGGER: sync_profile_role_to_jwt()
   ↓
   User must re-login for changes

2. TOGGLE STATUS (Active/Suspended)
   ↓
   API: POST /api/users/toggle-status
   ↓
   UPDATE profiles SET status =
     CASE WHEN status='active'
          THEN 'suspended'
          ELSE 'active' END
   ↓
   ⚠️ User can still login (no enforcement)

3. TOGGLE VERIFICATION
   ↓
   UPDATE profiles SET verified = NOT verified
   ↓
   ⚠️ No effect on access

4. DELETE USER
   ↓
   API: POST /api/users/delete
   ↓
   Soft delete:
     UPDATE profiles SET status = 'deleted'
   ↓
   ⚠️ User account still exists in auth.users

5. UPDATE PASSWORD
   ↓
   API: POST /api/users/update-password
   ↓
   Uses Supabase Admin API:
     adminAuthClient.auth.admin.updateUserById(
       user_id,
       { password: new_password }
     )
   ↓
   Password changed ✅

6. CREATE NEW USER
   ↓
   API: POST /api/users/create
   ↓
   Creates:
     1. auth.users entry
     2. public.profiles entry
     3. Sets role and status
   ↓
   Auto-generates temporary password
```

---

## 7. KNOWN ISSUES & SOLUTIONS

### 7.1 AUTHENTICATION ISSUES

#### Issue 1: Role Change Delay
**Problem:**
```
Admin changes user role → User still has old role in JWT
User must re-login to get new permissions
```

**Why:**
- JWT is issued at login time
- Contains role in app_metadata
- Doesn't auto-refresh when role changes in database

**Solution:**
```
Option A (Current): User must re-login
Option B (Better): Implement JWT refresh on role change
Option C (Best): Use Supabase realtime to detect role changes
```

**Fix Code:**
```typescript
// In AuthContext.tsx
const checkRoleUpdate = async () => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const jwtRole = user.app_metadata?.role;

  if (profile.role !== jwtRole) {
    // Force refresh token
    await supabase.auth.refreshSession();
    // OR force re-login
    await supabase.auth.signOut();
    router.push('/login');
  }
};
```

---

#### Issue 2: Suspended Users Can Still Login
**Problem:**
```
Admin suspends user (status='suspended')
User can still login and use the system
```

**Why:**
- Status check not enforced at auth level
- RLS policies don't block suspended users
- Frontend doesn't check status

**Solution:**
```sql
-- Add RLS policy to block suspended users
CREATE POLICY "Suspended users cannot access"
ON profiles
FOR ALL
TO authenticated
USING (
  status != 'suspended' OR id = auth.uid()
);

-- Update auth trigger to check status
CREATE OR REPLACE FUNCTION check_user_status()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT status FROM profiles WHERE id = auth.uid()) = 'suspended' THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

#### Issue 3: Email Verification Bypassed
**Problem:**
```
Users can sign up and immediately login
No email verification required
```

**Why:**
- `handle_new_user()` trigger auto-confirms emails
- Designed for easier testing/development

**Solution (Production):**
```sql
-- Remove auto-confirmation in handle_new_user()
-- Let Supabase handle email verification flow

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Remove this line:
  -- UPDATE auth.users SET email_confirmed_at = now() ...

  -- Just create profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'guest');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 7.2 BOOKING ISSUES

#### Issue 4: No Room Availability Check
**Problem:**
```
Hotel has 5 rooms of type 'double'
System allows 10 bookings for same dates
Double-booking occurs
```

**Why:**
- No availability validation in booking creation
- No conflict check with existing bookings

**Solution:**
```sql
-- Create function to check room availability
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id UUID,
  p_check_in TIMESTAMPTZ,
  p_check_out TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_room_quantity INTEGER;
  v_booked_count INTEGER;
BEGIN
  -- Get total room quantity
  SELECT quantity INTO v_room_quantity
  FROM rooms
  WHERE id = p_room_id;

  -- Count existing bookings for date range
  SELECT COUNT(*) INTO v_booked_count
  FROM bookings
  WHERE room_id = p_room_id
    AND status IN ('pending', 'confirmed')
    AND (
      (check_in, check_out) OVERLAPS (p_check_in, p_check_out)
    );

  -- Check if available
  RETURN (v_booked_count < v_room_quantity);
END;
$$ LANGUAGE plpgsql;

-- Use in booking creation
-- Frontend should call this before allowing booking
```

**Frontend Fix:**
```typescript
// In booking form
const checkAvailability = async () => {
  const { data, error } = await supabase
    .rpc('check_room_availability', {
      p_room_id: roomId,
      p_check_in: checkIn,
      p_check_out: checkOut
    });

  if (!data) {
    alert('Room not available for selected dates');
    return false;
  }
  return true;
};
```

---

#### Issue 5: Commission Not Auto-Calculated
**Problem:**
```
Booking created but commission_amount = 0
Must be manually calculated
```

**Why:**
- Trigger exists but might not fire correctly
- Property type might not match commission_settings

**Debug:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger
WHERE tgname = 'set_booking_commission_trigger';

-- Check commission settings
SELECT * FROM commission_settings;

-- Test commission calculation
SELECT calculate_booking_commission('hotel', 100);
```

**Fix:**
```sql
-- Ensure trigger is active
CREATE TRIGGER set_booking_commission_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_commission();

-- Fix property_type mismatch
UPDATE bookings
SET property_type = (
  SELECT listing_type
  FROM listings
  WHERE id = bookings.listing_id
)
WHERE property_type IS NULL;
```

---

### 7.3 LISTING ISSUES

#### Issue 6: Approved Listings Not Visible
**Problem:**
```
Admin approves listing
Listing doesn't appear in public search
```

**Why:**
Multiple conditions must be true:
- approval_status = 'approved' ✅
- is_active = true ❌ (often forgotten)
- is_available = true ❌ (for bookings)

**Solution:**
```sql
-- Auto-set is_active when approved
CREATE OR REPLACE FUNCTION auto_activate_approved_listings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    NEW.is_active = true;
    NEW.is_available = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_activate_trigger
BEFORE UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION auto_activate_approved_listings();
```

---

#### Issue 7: Image Upload Failures
**Problem:**
```
Images uploaded but not saved
Upload succeeds but image URLs not stored
```

**Why:**
- Storage bucket permissions
- File path issues
- Array update failures

**Debug:**
```sql
-- Check storage bucket policies
SELECT * FROM storage.buckets WHERE id = 'listing-images';

-- Check if images saved
SELECT id, images FROM hotels WHERE images IS NOT NULL;
```

**Fix:**
```typescript
// Proper image upload flow
const uploadImages = async (files: File[]) => {
  const urls = [];

  for (const file of files) {
    // 1. Upload to storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('listing-images')
      .upload(`hotels/${fileName}`, file);

    if (error) {
      console.error('Upload failed:', error);
      continue;
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(data.path);

    urls.push(publicUrl);
  }

  // 3. Update database
  await supabase
    .from('hotels')
    .update({ images: urls })
    .eq('id', hotelId);
};
```

---

### 7.4 ADMIN PANEL ISSUES

#### Issue 8: Stats Not Loading
**Problem:**
```
/admin dashboard shows empty stats
Loading indefinitely
```

**Why:**
- RLS blocking admin queries
- Role not in JWT
- Database function errors

**Debug:**
```sql
-- Check if user is admin
SELECT id, role FROM profiles WHERE id = auth.uid();

-- Check JWT role
SELECT (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role';

-- Test admin query manually
SELECT COUNT(*) FROM listings;
```

**Fix:**
```typescript
// In admin stats API route
// Use service role client for admin operations
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
);

// Now queries bypass RLS
const { data: listings } = await supabaseAdmin
  .from('listings')
  .select('*');
```

**⚠️ SECURITY WARNING:**
Never expose service_role_key to frontend!
Only use in server-side API routes.

---

#### Issue 9: User List Empty for Admin
**Problem:**
```
Admin sees empty user list
/admin/users shows no results
```

**Why:**
- RLS policy too restrictive
- Role check failing
- API route not using correct client

**Fix:**
```sql
-- Check RLS policy
SELECT * FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname LIKE '%admin%';

-- Ensure admin can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid())
  IN ('admin', 'super_admin')
);
```

---

### 7.5 PERFORMANCE ISSUES

#### Issue 10: Slow Listing Queries
**Problem:**
```
/properties page loads slowly
Takes 5+ seconds
```

**Why:**
- Missing indexes
- N+1 query problem
- Large image arrays

**Solution:**
```sql
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_listings_approval_active
ON listings(approval_status, is_active, is_available)
WHERE approval_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_listings_host_id
ON listings(host_id);

CREATE INDEX IF NOT EXISTS idx_hotels_listing_id
ON hotels(listing_id);

-- Use proper joins
SELECT
  l.*,
  h.name as hotel_name,
  h.city,
  h.images[1] as thumbnail -- Just first image
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
WHERE l.approval_status = 'approved'
  AND l.is_active = true
LIMIT 20;
```

---

#### Issue 11: Too Many RLS Checks
**Problem:**
```
Every query runs slow
auth.uid() called multiple times per query
```

**Why:**
- RLS policies re-evaluate for each row
- Nested queries in policies
- No caching

**Solution:**
```sql
-- Use materialized views for admin queries
CREATE MATERIALIZED VIEW admin_listing_stats AS
SELECT
  l.id,
  l.host_id,
  l.listing_type,
  l.approval_status,
  COUNT(b.id) as booking_count,
  SUM(b.total_price) as total_revenue
FROM listings l
LEFT JOIN bookings b ON b.listing_id = l.id
GROUP BY l.id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW admin_listing_stats;

-- Or use SECURITY DEFINER views for admins
CREATE VIEW admin_all_listings
WITH (security_invoker = false) -- SECURITY DEFINER
AS
SELECT * FROM listings;

GRANT SELECT ON admin_all_listings TO admin_role;
```

⚠️ **Security Note:** Only use SECURITY DEFINER views when absolutely necessary and with strict access control.

---

## SUMMARY - Muhiimka Ah

### ✅ WHAT WORKS WELL

1. **Authentication**: Supabase auth working, auto-signup, JWT tokens
2. **RLS Security**: All tables protected, role-based access
3. **Listing Creation**: Hosts can create hotels/guesthouses
4. **Admin Panel**: Full management interface
5. **Commission System**: Auto-calculated on bookings
6. **Image Upload**: Supabase storage integration
7. **Multi-role System**: Guest, Host, Admin, Super Admin

### ⚠️ CRITICAL ISSUES

1. **Role Change Delay**: Users must re-login after role change
2. **No Room Availability Check**: Double-booking possible
3. **Manual Payments**: No automated payment gateway
4. **Suspended Users Can Login**: Status not enforced
5. **Listings Not Auto-Activated**: Manual is_active toggle needed
6. **Performance**: Some queries slow without proper indexing

### 🔧 QUICK FIXES NEEDED

1. Add room availability validation
2. Auto-activate listings on approval
3. Enforce status checks at login
4. Add database indexes for performance
5. Implement JWT refresh on role change
6. Add proper error handling throughout

### 📊 DATABASE HEALTH

- **Tables**: 21 tables ✅
- **RLS**: Enabled on all public tables ✅
- **Triggers**: 8 active triggers ✅
- **Functions**: 14 functions (mostly SECURITY DEFINER) ⚠️
- **Policies**: 50+ RLS policies ✅
- **Indexes**: Some missing (needs optimization) ⚠️

---

**Halkan waxaad ka heli kartaa dhammaan macluumaadka aad u baahan tahay si aad u fahamto sida system-kan u dhisan yahay iyo meesha ay dhibaatooyinku ka jiraan.**

**Haddii aad u baahan tahay macluumaad dheeraad ah ama aad rabto in la hagaajiyo cilad gaar ah, i soo sheeg!**