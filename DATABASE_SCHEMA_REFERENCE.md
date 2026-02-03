# DATABASE SCHEMA - Quick Reference

> Xogta dhammaan tables iyo sida ay u xidhiidhan yihiin

---

## CORE TABLES SUMMARY

| Table | Purpose | Rows | RLS | Key Columns |
|-------|---------|------|-----|-------------|
| `profiles` | User accounts | 8 | ✅ | id, email, role, status |
| `listings` | Property listings | 1 | ✅ | id, host_id, listing_type, approval_status |
| `hotels` | Hotel details | 1 | ✅ | id, listing_id, name, city |
| `rooms` | Hotel rooms | 4 | ✅ | id, hotel_id, room_type, price |
| `guesthouses` | Rental properties | 0 | ✅ | id, listing_id, title, price |
| `bookings` | Booking records | 0 | ✅ | id, guest_id, listing_id, total_price |
| `payments` | Payment records | 0 | ✅ | id, booking_id, amount, status |
| `commission_settings` | Commission rates | 4 | ✅ | property_type, commission_rate |
| `host_requests` | Host applications | 0 | ✅ | user_id, status |
| `property_sales` | Properties for sale | 0 | ✅ | seller_id, title, price |
| `waiting_list` | Booking waitlist | 0 | ✅ | listing_id, guest_id, status |

---

## 1. PROFILES (User Accounts)

```sql
Table: profiles
Purpose: Store all user account information
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)         → Links to auth.users.id
├─ email               TEXT              → User email
├─ full_name           TEXT              → User's full name
├─ phone               TEXT              → Phone number
├─ role                TEXT              → 'guest' | 'host' | 'admin' | 'super_admin'
├─ status              TEXT              → 'active' | 'suspended' | 'deleted'
├─ verified            BOOLEAN (true)    → Is user verified?
├─ is_active           BOOLEAN (true)    → Is account active?
├─ property_types      TEXT[]            → Host's property types
├─ avatar_url          TEXT              → Profile picture URL
├─ district_id         UUID              → Geographic location
├─ zone_id             UUID              → Geographic zone
├─ created_at          TIMESTAMPTZ       → When created
└─ updated_at          TIMESTAMPTZ       → Last updated

Relationships:
├─→ 1:Many → listings (as host_id)
├─→ 1:Many → bookings (as guest_id)
├─→ 1:Many → host_requests (as user_id)
├─→ 1:Many → property_sales (as seller_id)
└─→ 1:Many → payments (as business_id)

RLS Policies:
✅ Users can read own profile
✅ Admins can read all profiles
✅ Users can update own profile
✅ Only admins can change roles

Triggers:
✅ Auto-created on user signup via handle_new_user()
✅ Role synced to JWT via sync_profile_role_to_jwt()
```

**Common Queries:**
```sql
-- Get user by email
SELECT * FROM profiles WHERE email = 'user@example.com';

-- Get all hosts
SELECT * FROM profiles WHERE role = 'host' AND status = 'active';

-- Count users by role
SELECT role, COUNT(*) FROM profiles GROUP BY role;
```

---

## 2. LISTINGS (Property Listings)

```sql
Table: listings
Purpose: Store all property listings (hotels, guesthouses, rentals)
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ host_id             UUID (FK → profiles.id)
├─ listing_type        TEXT              → 'hotel' | 'fully_furnished' | 'rental'
├─ approval_status     TEXT ('pending')  → 'pending' | 'approved' | 'rejected'
├─ is_active           BOOLEAN (false)   → Is listing active?
├─ is_available        BOOLEAN (true)    → Is available for booking?
├─ is_featured         BOOLEAN (false)   → Is featured listing?
├─ status              TEXT ('pending')  → Legacy status field
├─ commission_rate     NUMERIC (0.00)    → Commission percentage
├─ approved_by         UUID              → Which admin approved
├─ approved_at         TIMESTAMPTZ       → When approved
├─ rejected_at         TIMESTAMPTZ       → When rejected
├─ rejection_reason    TEXT              → Why rejected
├─ created_at          TIMESTAMPTZ
└─ updated_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → profiles (host_id)
├─→ 1:1 → hotels (if listing_type = 'hotel')
├─→ 1:1 → guesthouses (if listing_type != 'hotel')
├─→ 1:Many → bookings
└─→ 1:Many → waiting_list

RLS Policies:
✅ Public can view approved & active listings
✅ Hosts can view their own listings
✅ Admins can view all listings
✅ Hosts can create listings
✅ Only admins can approve/reject

Triggers:
✅ updated_at auto-updated via update_listings_updated_at()

⚠️ CRITICAL: For listing to be visible, ALL must be true:
   - approval_status = 'approved'
   - is_active = true
   - is_available = true (for bookings)
```

**Common Queries:**
```sql
-- Get all approved listings
SELECT * FROM listings
WHERE approval_status = 'approved'
  AND is_active = true;

-- Get pending listings for admin review
SELECT l.*, p.full_name as host_name
FROM listings l
JOIN profiles p ON p.id = l.host_id
WHERE l.approval_status = 'pending'
ORDER BY l.created_at DESC;

-- Get host's listings
SELECT * FROM listings
WHERE host_id = 'user-uuid'
ORDER BY created_at DESC;
```

---

## 3. HOTELS (Hotel Details)

```sql
Table: hotels
Purpose: Store hotel-specific information
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ listing_id          UUID (FK → listings.id, UNIQUE)
├─ name                TEXT              → Hotel name
├─ city                TEXT              → City location
├─ address             TEXT              → Full address
├─ description         TEXT              → Hotel description
├─ rating              INTEGER (1-5)     → Star rating
├─ amenities           TEXT[]            → ['WiFi', 'Pool', 'Restaurant']
├─ check_in_time       TEXT ('14:00')    → Check-in time
├─ check_out_time      TEXT ('12:00')    → Check-out time
├─ images              TEXT[]            → Array of image URLs
└─ created_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → listings (listing_id)
└─→ 1:Many → rooms

RLS Policies:
✅ Inherits from listings table
✅ Public can view if listing is approved
```

**Common Queries:**
```sql
-- Get hotel with rooms
SELECT
  h.*,
  array_agg(row_to_json(r.*)) as rooms
FROM hotels h
LEFT JOIN rooms r ON r.hotel_id = h.id
WHERE h.id = 'hotel-uuid'
GROUP BY h.id;

-- Search hotels by city
SELECT l.*, h.*
FROM listings l
JOIN hotels h ON h.listing_id = l.id
WHERE h.city ILIKE '%mogadishu%'
  AND l.approval_status = 'approved'
  AND l.is_active = true;
```

---

## 4. ROOMS (Hotel Rooms)

```sql
Table: rooms
Purpose: Store individual room types for hotels
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ hotel_id            UUID (FK → hotels.id)
├─ room_type           TEXT              → 'single' | 'double' | 'suite' | 'deluxe'
├─ price_per_night     NUMERIC           → Price per night
├─ max_guests          INTEGER           → Maximum guests allowed
├─ quantity            INTEGER           → Number of rooms of this type
├─ amenities           TEXT[]            → Room-specific amenities
├─ images              TEXT[]            → Room images
└─ created_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → hotels (hotel_id)
└─→ 1:Many → bookings (room_id)

RLS Policies:
✅ Public can view rooms of approved hotels

⚠️ CRITICAL ISSUE: No availability tracking!
   - Quantity shows total rooms
   - No check for overlapping bookings
   - Double-booking possible
```

**Common Queries:**
```sql
-- Get available rooms for hotel
SELECT * FROM rooms
WHERE hotel_id = 'hotel-uuid'
ORDER BY price_per_night ASC;

-- Check room availability (MANUAL - no automated check)
SELECT
  r.*,
  COUNT(b.id) as active_bookings
FROM rooms r
LEFT JOIN bookings b ON b.room_id = r.id
  AND b.status IN ('pending', 'confirmed')
  AND (b.check_in, b.check_out) OVERLAPS ('2026-02-01', '2026-02-05')
WHERE r.id = 'room-uuid'
GROUP BY r.id;
```

---

## 5. GUESTHOUSES (Rental Properties)

```sql
Table: guesthouses
Purpose: Store rental properties (apartments, houses, villas)
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ listing_id          UUID (FK → listings.id, UNIQUE)
├─ title               TEXT              → Property title
├─ property_type       TEXT              → 'house' | 'apartment' | 'villa' | 'guesthouse'
├─ city                TEXT
├─ address             TEXT
├─ description         TEXT
├─ price_type          TEXT              → 'night' | 'month'
├─ price               NUMERIC
├─ bedrooms            INTEGER
├─ bathrooms           INTEGER
├─ max_guests          INTEGER
├─ amenities           TEXT[]
├─ images              TEXT[]
└─ created_at          TIMESTAMPTZ

Relationships:
└─→ Many:1 → listings (listing_id)

RLS Policies:
✅ Inherits from listings table
```

**Common Queries:**
```sql
-- Search guesthouses by price range
SELECT l.*, g.*
FROM listings l
JOIN guesthouses g ON g.listing_id = l.id
WHERE g.price BETWEEN 50 AND 200
  AND l.approval_status = 'approved'
  AND l.is_active = true;

-- Get guesthouses by city
SELECT * FROM guesthouses
WHERE city ILIKE '%hargeisa%';
```

---

## 6. BOOKINGS (Booking Records)

```sql
Table: bookings
Purpose: Store all booking/reservation records
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ guest_id            UUID (FK → profiles.id)
├─ listing_id          UUID (FK → listings.id)
├─ room_id             UUID (FK → rooms.id, nullable)
├─ property_id         UUID (nullable)
├─ booking_type        TEXT ('listing')  → 'listing' | 'property'
├─ property_type       TEXT              → 'hotel' | 'fully_furnished' (for commission)
├─ check_in            TIMESTAMPTZ
├─ check_out           TIMESTAMPTZ
├─ num_guests          INTEGER
├─ total_price         NUMERIC
├─ commission_amount   NUMERIC (0.00)    → Auto-calculated
├─ status              TEXT ('pending')  → 'pending' | 'confirmed' | 'cancelled' | 'completed'
├─ payment_status      TEXT ('pending')  → 'pending' | 'paid' | 'refunded' | 'failed'
├─ payment_method      TEXT              → 'card' | 'cash' | 'bank_transfer' | 'mobile_money'
├─ special_requests    TEXT
├─ cancellation_reason TEXT
├─ cancelled_at        TIMESTAMPTZ
├─ created_at          TIMESTAMPTZ
└─ updated_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → profiles (guest_id)
├─→ Many:1 → listings (listing_id)
├─→ Many:1 → rooms (room_id)
└─→ 1:Many → payments (booking_id)

RLS Policies:
✅ Guests can view own bookings
✅ Hosts can view bookings for their listings
✅ Admins can view all bookings

Triggers:
✅ commission_amount auto-calculated via set_booking_commission()

⚠️ CRITICAL: Commission calculation depends on property_type being set correctly
```

**Common Queries:**
```sql
-- Get guest's bookings
SELECT
  b.*,
  l.listing_type,
  h.name as hotel_name,
  g.title as guesthouse_title
FROM bookings b
LEFT JOIN listings l ON l.id = b.listing_id
LEFT JOIN hotels h ON h.listing_id = l.id
LEFT JOIN guesthouses g ON g.listing_id = l.id
WHERE b.guest_id = 'user-uuid'
ORDER BY b.created_at DESC;

-- Get upcoming bookings for host
SELECT b.*, p.full_name as guest_name
FROM bookings b
JOIN listings l ON l.id = b.listing_id
JOIN profiles p ON p.id = b.guest_id
WHERE l.host_id = 'host-uuid'
  AND b.check_in > now()
  AND b.status IN ('pending', 'confirmed')
ORDER BY b.check_in ASC;

-- Calculate total revenue
SELECT
  SUM(total_price) as total_revenue,
  SUM(commission_amount) as platform_commission,
  SUM(total_price - commission_amount) as host_payout
FROM bookings
WHERE status = 'completed'
  AND payment_status = 'paid';
```

---

## 7. PAYMENTS (Payment Records)

```sql
Table: payments
Purpose: Track all payment transactions
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ booking_id          UUID (FK → bookings.id)
├─ business_id         UUID (FK → profiles.id)  → Who receives payment
├─ amount              NUMERIC
├─ currency            TEXT ('USD')
├─ payment_method      TEXT              → 'evc_plus' | 'edahab' | 'sahal' | 'cash' | 'other'
├─ transaction_id      TEXT              → External transaction ID
├─ status              TEXT ('pending')  → Duplicate of payment_status
├─ payment_status      TEXT ('pending')  → 'pending' | 'completed' | 'failed' | 'refunded'
├─ period_start        DATE
├─ period_end          DATE
├─ paid_at             TIMESTAMPTZ
└─ created_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → bookings (booking_id)
└─→ Many:1 → profiles (business_id)

RLS Policies:
✅ Users can view their own payments
✅ Admins can view all payments

⚠️ NOTE: Has both 'status' and 'payment_status' - redundant
```

**Common Queries:**
```sql
-- Get payments for a booking
SELECT * FROM payments
WHERE booking_id = 'booking-uuid';

-- Get host's payments
SELECT
  p.*,
  b.total_price,
  pr.full_name as guest_name
FROM payments p
JOIN bookings b ON b.id = p.booking_id
JOIN profiles pr ON pr.id = b.guest_id
WHERE p.business_id = 'host-uuid'
  AND p.payment_status = 'completed'
ORDER BY p.paid_at DESC;

-- Payment summary
SELECT
  payment_method,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM payments
WHERE payment_status = 'completed'
GROUP BY payment_method;
```

---

## 8. COMMISSION_SETTINGS (Commission Configuration)

```sql
Table: commission_settings
Purpose: Define commission rates for different property types
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ property_type       TEXT (UNIQUE)     → 'hotel' | 'fully_furnished' | 'rental' | 'property_sales'
├─ commission_rate     NUMERIC (0)       → Percentage (e.g., 10.00 = 10%)
├─ is_active           BOOLEAN (true)
├─ description         TEXT
├─ created_at          TIMESTAMPTZ
└─ updated_at          TIMESTAMPTZ

Current Data:
┌─────────────────┬──────────────┐
│ property_type   │ commission % │
├─────────────────┼──────────────┤
│ hotel           │ 10.00        │
│ fully_furnished │  8.00        │
│ rental          │  5.00        │
│ property_sales  │  3.00        │
└─────────────────┴──────────────┘

RLS Policies:
✅ Public can read (to show commission info)
✅ Only super_admin can modify

Triggers:
✅ updated_at auto-updated

Used By:
├─→ calculate_booking_commission() function
└─→ set_booking_commission() trigger
```

**Common Queries:**
```sql
-- Get active commission rates
SELECT * FROM commission_settings
WHERE is_active = true;

-- Update commission rate (super_admin only)
UPDATE commission_settings
SET commission_rate = 12.00,
    updated_at = now()
WHERE property_type = 'hotel';

-- Commission analytics
SELECT
  cs.property_type,
  cs.commission_rate,
  COUNT(b.id) as booking_count,
  SUM(b.commission_amount) as total_commission
FROM commission_settings cs
LEFT JOIN bookings b ON b.property_type = cs.property_type
  AND b.payment_status = 'paid'
GROUP BY cs.id;
```

---

## 9. HOST_REQUESTS (Host Applications)

```sql
Table: host_requests
Purpose: Store applications from users who want to become hosts
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ user_id             UUID (FK → profiles.id)
├─ full_name           TEXT
├─ phone               TEXT
├─ property_type       TEXT
├─ location            TEXT
├─ status              TEXT ('pending')  → 'pending' | 'approved' | 'rejected'
├─ created_at          TIMESTAMPTZ
└─ updated_at          TIMESTAMPTZ

RLS Policies:
✅ Users can create requests
✅ Users can view own requests
✅ Admins can view all requests

⚠️ MANUAL PROCESS:
   - User submits request
   - Admin reviews and approves
   - Admin must manually change user role to 'host'
   - No automatic role upgrade
```

**Common Queries:**
```sql
-- Get pending requests
SELECT
  hr.*,
  p.email,
  p.role as current_role
FROM host_requests hr
JOIN profiles p ON p.id = hr.user_id
WHERE hr.status = 'pending'
ORDER BY hr.created_at ASC;

-- Approve request (admin must still change role manually)
UPDATE host_requests
SET status = 'approved',
    updated_at = now()
WHERE id = 'request-uuid';
```

---

## 10. PROPERTY_SALES (Properties for Sale)

```sql
Table: property_sales
Purpose: Properties listed for sale (not rental)
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ seller_id           UUID (FK → profiles.id)
├─ title               TEXT
├─ description         TEXT
├─ property_type       TEXT              → 'land' | 'house' | 'apartment' | 'commercial' | 'villa' | 'farm'
├─ price               NUMERIC
├─ size_sqm            NUMERIC           → Size in square meters
├─ bedrooms            INTEGER
├─ bathrooms           INTEGER
├─ city                TEXT
├─ address             TEXT
├─ features            TEXT[]            → ['Garden', 'Garage', etc]
├─ images              TEXT[]
├─ status              TEXT ('active')   → 'active' | 'pending' | 'sold' | 'withdrawn'
├─ is_featured         BOOLEAN (false)
├─ views_count         INTEGER (0)
├─ created_at          TIMESTAMPTZ
└─ updated_at          TIMESTAMPTZ

Relationships:
├─→ Many:1 → profiles (seller_id)
└─→ 1:Many → sales_inquiries

RLS Policies:
✅ Public can view active listings
✅ Sellers can manage own properties
✅ Admins can manage all properties
```

**Common Queries:**
```sql
-- Search properties by price range
SELECT * FROM property_sales
WHERE price BETWEEN 50000 AND 200000
  AND status = 'active'
ORDER BY created_at DESC;

-- Featured properties
SELECT * FROM property_sales
WHERE is_featured = true
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 11. WAITING_LIST (Booking Waitlist)

```sql
Table: waiting_list
Purpose: Queue guests when property is fully booked
RLS: Enabled ✅

Columns:
├─ id                  UUID (PK)
├─ listing_id          UUID (FK → listings.id)
├─ guest_id            UUID (FK → profiles.id)
├─ status              TEXT ('pending')  → 'pending' | 'notified' | 'booked' | 'cancelled'
└─ created_at          TIMESTAMPTZ

⚠️ CURRENTLY UNUSED - No waitlist functionality implemented
```

---

## VIEWS (Database Views)

### inquiry_listings
```sql
Type: View (SECURITY INVOKER)
Purpose: Show approved inquiry-only listings
Filters: approval_status='approved' AND is_active=true

Security: Runs with caller's permissions (RLS applied)
```

### bookable_listings
```sql
Type: View (SECURITY INVOKER)
Purpose: Show approved & available listings for booking
Filters: approval_status='approved' AND is_active=true AND is_available=true

Security: Runs with caller's permissions (RLS applied)
```

---

## FUNCTIONS & TRIGGERS

### Authentication Functions (SECURITY DEFINER)

```sql
1. handle_new_user()
   Trigger: AFTER INSERT ON auth.users
   Purpose: Auto-create profile on signup
   Actions:
   - Creates profile with role='guest'
   - Sets JWT metadata
   - Auto-confirms email

2. sync_profile_role_to_jwt()
   Trigger: AFTER UPDATE ON profiles (when role changes)
   Purpose: Sync role to JWT metadata
   Actions:
   - Updates auth.users.raw_app_meta_data
   - User must re-login for changes

3. sync_user_role_to_jwt()
   Function: Manual call by admin
   Purpose: Force JWT sync for user
```

### Booking Functions (SECURITY DEFINER)

```sql
4. calculate_booking_commission(property_type, total_price)
   Purpose: Calculate commission amount
   Returns: NUMERIC
   Logic:
   - Looks up commission_rate from commission_settings
   - Returns: total_price * (rate / 100)

5. set_booking_commission()
   Trigger: BEFORE INSERT OR UPDATE ON bookings
   Purpose: Auto-set commission_amount
   Uses: calculate_booking_commission()
```

### Timestamp Functions (SECURITY DEFINER)

```sql
6. update_listings_updated_at()
   Trigger: BEFORE UPDATE ON listings
   Purpose: Auto-update updated_at column

7. update_host_requests_updated_at()
   Trigger: BEFORE UPDATE ON host_requests
```

---

## STORAGE BUCKETS

```
Supabase Storage Structure:

listing-images/
├── hotels/
│   ├── hotel-123-main.jpg
│   ├── hotel-123-room.jpg
│   └── ...
└── guesthouses/
    └── ...

room-images/
├── room-456-bed.jpg
├── room-456-bathroom.jpg
└── ...

property-images/
├── sale-789-exterior.jpg
└── ...

avatars/
├── user-uuid-1.jpg
└── ...

Policies:
✅ Public read for approved listings
✅ Authenticated users can upload
✅ Size limits enforced (5MB per file)
```

---

## DATABASE STATISTICS

```sql
-- Current row counts
SELECT
  'profiles' as table_name, COUNT(*) as rows FROM profiles
UNION ALL
SELECT 'listings', COUNT(*) FROM listings
UNION ALL
SELECT 'hotels', COUNT(*) FROM hotels
UNION ALL
SELECT 'rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

Result:
┌─────────────┬──────┐
│ table_name  │ rows │
├─────────────┼──────┤
│ profiles    │    8 │
│ listings    │    1 │
│ hotels      │    1 │
│ rooms       │    4 │
│ bookings    │    0 │
│ payments    │    0 │
└─────────────┴──────┘


-- RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables have RLS enabled ✅


-- Index coverage
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

⚠️ Some tables missing performance indexes
```

---

## COMMON DEBUGGING QUERIES

```sql
-- 1. Check user role and JWT
SELECT
  p.id,
  p.email,
  p.role as profile_role,
  u.raw_app_meta_data->>'role' as jwt_role,
  CASE
    WHEN p.role = u.raw_app_meta_data->>'role' THEN '✅ Synced'
    ELSE '❌ OUT OF SYNC - User needs re-login'
  END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id;


-- 2. Check listing visibility
SELECT
  l.id,
  l.approval_status,
  l.is_active,
  l.is_available,
  CASE
    WHEN l.approval_status = 'approved'
     AND l.is_active = true
     AND l.is_available = true
    THEN '✅ VISIBLE'
    ELSE '❌ HIDDEN'
  END as visibility
FROM listings l;


-- 3. Check commission calculation
SELECT
  b.id,
  b.total_price,
  b.property_type,
  b.commission_amount,
  cs.commission_rate,
  (b.total_price * cs.commission_rate / 100) as expected_commission,
  CASE
    WHEN b.commission_amount = (b.total_price * cs.commission_rate / 100)
    THEN '✅ Correct'
    ELSE '❌ WRONG - Needs fix'
  END as status
FROM bookings b
LEFT JOIN commission_settings cs ON cs.property_type = b.property_type;


-- 4. Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'INSERT' THEN 'Create'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
    ELSE cmd
  END as operation,
  CASE
    WHEN permissive = 'PERMISSIVE' THEN '✅ Allow'
    ELSE '❌ Restrict'
  END as type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;


-- 5. Check triggers
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    WHEN tgenabled = 'D' THEN '❌ Disabled'
    ELSE tgenabled::text
  END as status
FROM pg_trigger
WHERE tgisinternal = false
  AND tgrelid::regclass::text LIKE 'public.%'
ORDER BY table_name, trigger_name;
```

---

**Waa kuwan dhammaan tables iyo sida ay u shaqeeyaan!**

**Isticmaal queries-kan debugging-ka haddii aad cilad ku aragto!**