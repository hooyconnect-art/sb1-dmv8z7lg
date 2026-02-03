# HOYCONNECT - System Flow Diagrams

> Visual diagrams showing how data flows through the system

---

## 1. USER SIGNUP & LOGIN FLOW

```
┌────────────────────────────────────────────────────────────────────┐
│                         USER SIGNUP FLOW                            │
└────────────────────────────────────────────────────────────────────┘

    User
     │
     ├─→ Opens /signup
     │
     ├─→ Enters:
     │   • Email
     │   • Password
     │   • Full Name
     │
     ├─→ Clicks "Sign Up"
     │
     ▼
  Frontend
  (signup page)
     │
     ├─→ Calls: supabase.auth.signUp()
     │
     ▼
  Supabase Auth
  (auth.users table)
     │
     ├─→ Creates new user
     │   • id: UUID
     │   • email: user@example.com
     │   • encrypted_password: ***
     │   • raw_app_meta_data: {}
     │
     ├─→ Fires TRIGGER: handle_new_user()
     │
     ▼
  Database Trigger
  [SECURITY DEFINER]
     │
     ├─→ Creates profile:
     │   INSERT INTO profiles (
     │     id = new_user_id,
     │     email = user_email,
     │     full_name = form_name,
     │     role = 'guest'  ← DEFAULT
     │   )
     │
     ├─→ Updates JWT metadata:
     │   UPDATE auth.users
     │   SET raw_app_meta_data = jsonb_build_object('role', 'guest')
     │
     ├─→ Auto-confirms email:
     │   UPDATE auth.users
     │   SET email_confirmed_at = now()
     │
     ▼
  Response
     │
     ├─→ JWT Token issued
     │   {
     │     "sub": "user-uuid",
     │     "email": "user@example.com",
     │     "app_metadata": {
     │       "role": "guest"
     │     }
     │   }
     │
     ├─→ User logged in automatically
     │
     └─→ Redirect to /dashboard


┌────────────────────────────────────────────────────────────────────┐
│                         USER LOGIN FLOW                             │
└────────────────────────────────────────────────────────────────────┘

    User
     │
     ├─→ Opens /login
     │
     ├─→ Enters:
     │   • Email
     │   • Password
     │
     ├─→ Clicks "Login"
     │
     ▼
  Frontend
     │
     ├─→ Calls: supabase.auth.signInWithPassword()
     │
     ▼
  Supabase Auth
     │
     ├─→ Validates credentials
     │   • Check email exists
     │   • Verify password hash
     │
     ├─→ Issues JWT token
     │   • Contains user.id
     │   • Contains app_metadata.role
     │
     ▼
  Frontend
  (AuthContext)
     │
     ├─→ Stores session
     │   • localStorage
     │   • React Context
     │
     ├─→ Loads user profile:
     │   SELECT * FROM profiles
     │   WHERE id = auth.uid()
     │
     ├─→ Checks role and redirects:
     │   • guest → /dashboard
     │   • host → /host/dashboard
     │   • admin → /admin
     │   • super_admin → /admin
     │
     └─→ User authenticated ✅
```

---

## 2. HOST LISTING CREATION FLOW

```
┌────────────────────────────────────────────────────────────────────┐
│                     CREATE HOTEL LISTING                            │
└────────────────────────────────────────────────────────────────────┘

    Host User
     │
     ├─→ Role = 'host' ✅
     │
     ├─→ Opens /host/listings/new
     │
     ├─→ Selects "Hotel"
     │
     ├─→ Redirects to /host/listings/new/hotel
     │
     ▼
  Hotel Form
     │
     ├─→ Step 1: Hotel Details
     │   • Name: "Jazeera Palace Hotel"
     │   • City: "Mogadishu"
     │   • Address: "KM4, Maka Al-Mukarama Road"
     │   • Description: "Luxury hotel..."
     │   • Amenities: [WiFi, Pool, Restaurant]
     │   • Upload images: [img1.jpg, img2.jpg]
     │
     ├─→ Step 2: Add Rooms
     │   Room 1:
     │   • Type: "Deluxe Double"
     │   • Price: $80/night
     │   • Quantity: 10 rooms
     │   • Max guests: 2
     │   • Images: [room1.jpg]
     │
     │   Room 2:
     │   • Type: "Suite"
     │   • Price: $150/night
     │   • Quantity: 5 rooms
     │   • Max guests: 4
     │
     ├─→ Clicks "Submit"
     │
     ▼
  Frontend Processing
     │
     ├─→ Upload images:
     │   FOR each image:
     │     supabase.storage
     │       .from('listing-images')
     │       .upload('hotels/xxx.jpg', file)
     │
     │   Returns: [url1, url2, ...]
     │
     ├─→ Prepare data
     │
     ▼
  Backend API
  (/api/listings/create)
     │
     ├─→ Start Transaction
     │
     ├─→ Step 1: Create Listing
     │   INSERT INTO listings (
     │     id,
     │     host_id = auth.uid(),
     │     listing_type = 'hotel',
     │     approval_status = 'pending',  ← Needs admin approval
     │     is_active = false,            ← Not active yet
     │     is_available = false,
     │     commission_rate = 10.00       ← From settings
     │   )
     │   RETURNING id
     │
     ├─→ Step 2: Create Hotel
     │   INSERT INTO hotels (
     │     listing_id = new_listing_id,
     │     name = "Jazeera Palace Hotel",
     │     city = "Mogadishu",
     │     address = "KM4...",
     │     description = "Luxury...",
     │     amenities = ARRAY['WiFi', 'Pool'],
     │     images = ARRAY[url1, url2],
     │     check_in_time = '14:00',
     │     check_out_time = '12:00'
     │   )
     │   RETURNING id
     │
     ├─→ Step 3: Create Rooms
     │   INSERT INTO rooms (
     │     hotel_id = new_hotel_id,
     │     room_type = 'Deluxe Double',
     │     price_per_night = 80.00,
     │     quantity = 10,
     │     max_guests = 2,
     │     images = ARRAY[room_url]
     │   )
     │
     │   INSERT INTO rooms (
     │     hotel_id = new_hotel_id,
     │     room_type = 'Suite',
     │     price_per_night = 150.00,
     │     quantity = 5,
     │     max_guests = 4
     │   )
     │
     ├─→ Commit Transaction
     │
     └─→ Return success


┌────────────────────────────────────────────────────────────────────┐
│                     ADMIN APPROVAL PROCESS                          │
└────────────────────────────────────────────────────────────────────┘

    Admin User
     │
     ├─→ Opens /admin/listings
     │
     ├─→ Sees pending listings:
     │   Query:
     │   SELECT * FROM listings
     │   WHERE approval_status = 'pending'
     │   ORDER BY created_at DESC
     │
     ├─→ Clicks on listing to review
     │
     ├─→ Views details:
     │   • Hotel info
     │   • Images
     │   • Rooms
     │   • Host profile
     │
     ├─→ Decision time
     │
     ▼

  OPTION A: APPROVE
     │
     ├─→ Admin clicks "Approve"
     │
     ├─→ API: POST /api/listings/approve
     │
     ├─→ Database update:
     │   UPDATE listings
     │   SET approval_status = 'approved',
     │       is_active = true,        ← Should be auto-set
     │       is_available = true,     ← Should be auto-set
     │       approved_by = admin_id,
     │       approved_at = now()
     │   WHERE id = listing_id
     │
     ├─→ Notification (future):
     │   • Email to host
     │   • SMS notification
     │
     └─→ Listing now PUBLIC ✅


  OPTION B: REJECT
     │
     ├─→ Admin clicks "Reject"
     │
     ├─→ Admin enters reason:
     │   "Images quality too low"
     │
     ├─→ API: POST /api/listings/reject
     │
     ├─→ Database update:
     │   UPDATE listings
     │   SET approval_status = 'rejected',
     │       rejection_reason = 'Images quality...',
     │       rejected_at = now()
     │   WHERE id = listing_id
     │
     ├─→ Notification to host
     │
     └─→ Listing remains HIDDEN ❌
```

---

## 3. GUEST BOOKING FLOW

```
┌────────────────────────────────────────────────────────────────────┐
│                     COMPLETE BOOKING FLOW                           │
└────────────────────────────────────────────────────────────────────┘

    Guest User
     │
     ├─→ Opens /properties
     │
     ├─→ Sees available listings:
     │   Query (through view):
     │   SELECT * FROM bookable_listings
     │   (approval_status='approved' + is_active=true + is_available=true)
     │
     ├─→ Clicks on hotel
     │
     ├─→ Opens /listings/[id]
     │
     ▼
  Listing Details Page
     │
     ├─→ Loads full data:
     │   SELECT
     │     l.*,
     │     h.*,
     │     r.*
     │   FROM listings l
     │   JOIN hotels h ON h.listing_id = l.id
     │   JOIN rooms r ON r.hotel_id = h.id
     │   WHERE l.id = [listing_id]
     │
     ├─→ Displays:
     │   • Hotel info
     │   • Images carousel
     │   • Amenities
     │   • Available rooms
     │   • Booking form
     │
     ▼
  Guest Fills Booking Form
     │
     ├─→ Selects:
     │   • Check-in date: 2026-02-01
     │   • Check-out date: 2026-02-05
     │   • Number of guests: 2
     │   • Room type: "Deluxe Double"
     │
     ├─→ System calculates:
     │   • Nights: 4
     │   • Room price: $80/night
     │   • Total: 4 × $80 = $320
     │   • Commission (10%): $32
     │   • Host receives: $288
     │
     ├─→ Clicks "Book Now"
     │
     ▼
  Frontend Validation
     │
     ├─→ Check dates valid?
     │   • Check-in > today ✅
     │   • Check-out > check-in ✅
     │
     ├─→ Check guests <= max_guests? ✅
     │
     ├─→ ⚠️ Check room available?
     │   (NOT IMPLEMENTED - CRITICAL BUG)
     │
     ▼
  Create Booking
     │
     ├─→ API: POST /api/bookings/create
     │
     ├─→ Database insert:
     │   INSERT INTO bookings (
     │     id = gen_random_uuid(),
     │     guest_id = auth.uid(),
     │     listing_id = [hotel_listing_id],
     │     room_id = [selected_room_id],
     │     booking_type = 'listing',
     │     property_type = 'hotel',      ← For commission
     │     check_in = '2026-02-01',
     │     check_out = '2026-02-05',
     │     num_guests = 2,
     │     total_price = 320.00,
     │     status = 'pending',           ← Awaiting payment
     │     payment_status = 'pending',
     │     created_at = now()
     │   )
     │   RETURNING id
     │
     ├─→ TRIGGER: set_booking_commission()
     │   • Looks up commission_rate for 'hotel'
     │   • Calculates: 320 × 0.10 = $32
     │   • Updates: commission_amount = 32.00
     │
     ├─→ Booking created with id
     │
     └─→ Redirect to payment


┌────────────────────────────────────────────────────────────────────┐
│                     PAYMENT PROCESS (MANUAL)                        │
└────────────────────────────────────────────────────────────────────┘

    Guest
     │
     ├─→ Receives booking confirmation
     │   "Please pay $320 to complete booking"
     │
     ├─→ Guest pays via:
     │   • EVC Plus
     │   • E-Dahab
     │   • Sahal
     │   • Cash
     │
     ├─→ Receives transaction ID:
     │   "TXN123456789"
     │
     ├─→ Contacts admin/host
     │   • WhatsApp
     │   • Phone call
     │   • System message
     │
     ├─→ Provides transaction ID
     │
     ▼
  Admin/Host Verification
     │
     ├─→ Admin checks payment:
     │   • Verifies transaction ID
     │   • Confirms amount received
     │
     ├─→ Admin updates booking:
     │   Opens /admin/bookings
     │   Finds booking
     │   Clicks "Mark as Paid"
     │
     ├─→ API: POST /api/bookings/confirm-payment
     │
     ├─→ Database update:
     │   UPDATE bookings
     │   SET payment_status = 'paid',
     │       status = 'confirmed',
     │       updated_at = now()
     │   WHERE id = booking_id
     │
     │   INSERT INTO payments (
     │     booking_id = booking_id,
     │     business_id = host_id,
     │     amount = 320.00,
     │     payment_method = 'evc_plus',
     │     transaction_id = 'TXN123456789',
     │     payment_status = 'completed',
     │     paid_at = now()
     │   )
     │
     ├─→ Send confirmation:
     │   • Email to guest
     │   • SMS notification
     │   • System notification
     │
     └─→ Booking CONFIRMED ✅


    Guest Arrival
     │
     ├─→ Guest arrives at hotel
     │
     ├─→ Host verifies booking:
     │   • Checks booking ID
     │   • Verifies guest identity
     │
     ├─→ Guest checks in
     │
     ├─→ Host marks:
     │   UPDATE bookings
     │   SET status = 'in_progress'
     │   (Future feature)


    Guest Departure
     │
     ├─→ Guest checks out
     │
     ├─→ Host marks:
     │   UPDATE bookings
     │   SET status = 'completed'
     │
     └─→ Booking completed ✅
```

---

## 4. ROLE CHANGE FLOW

```
┌────────────────────────────────────────────────────────────────────┐
│                 GUEST → HOST ROLE CHANGE                            │
└────────────────────────────────────────────────────────────────────┘

  OPTION 1: Host Application
  ──────────────────────────

    Guest User
     │
     ├─→ Opens /host/register
     │
     ├─→ Fills "Become a Host" form:
     │   • Full name
     │   • Phone number
     │   • Property type
     │   • Location
     │   • Reason for hosting
     │
     ├─→ Clicks "Submit Application"
     │
     ▼
  Database
     │
     ├─→ INSERT INTO host_requests (
     │     user_id = auth.uid(),
     │     full_name,
     │     phone,
     │     property_type,
     │     location,
     │     status = 'pending'
     │   )
     │
     └─→ Application submitted


    Admin Review
     │
     ├─→ Opens /admin/waiting-list
     │
     ├─→ Sees pending applications:
     │   SELECT * FROM host_requests
     │   WHERE status = 'pending'
     │
     ├─→ Reviews application:
     │   • User profile
     │   • Property details
     │   • Contact info
     │
     ├─→ Decision:
     │
     ▼

  APPROVE:
     │
     ├─→ Admin clicks "Approve"
     │
     ├─→ UPDATE host_requests
     │   SET status = 'approved'
     │
     ├─→ ⚠️ MANUAL STEP REQUIRED:
     │   Admin must go to /admin/users
     │   Find user
     │   Click "Change Role"
     │   Select "Host"
     │
     ├─→ API: POST /api/users/change-role
     │
     ├─→ UPDATE profiles
     │   SET role = 'host'
     │   WHERE id = user_id
     │
     ├─→ TRIGGER: sync_profile_role_to_jwt()
     │   UPDATE auth.users
     │   SET raw_app_meta_data = jsonb_build_object('role', 'host')
     │
     ├─→ ⚠️ User must RE-LOGIN
     │
     └─→ User now has host access ✅


  OPTION 2: Direct Admin Change
  ──────────────────────────────

    Admin
     │
     ├─→ Opens /admin/users
     │
     ├─→ Searches for user
     │
     ├─→ Clicks user → "Change Role"
     │
     ├─→ Selects new role:
     │   • guest
     │   • host
     │   • admin
     │   • super_admin
     │
     ├─→ Clicks "Save"
     │
     ├─→ Same flow as above
     │
     └─→ Role changed
```

---

## 5. DATABASE RELATIONSHIPS

```
┌────────────────────────────────────────────────────────────────────┐
│                    TABLE RELATIONSHIPS                              │
└────────────────────────────────────────────────────────────────────┘

auth.users (Supabase Auth)
    │
    │ 1:1
    ▼
profiles (User Accounts)
    │
    ├─→ 1:Many → listings (as host_id)
    ├─→ 1:Many → bookings (as guest_id)
    ├─→ 1:Many → host_requests (as user_id)
    ├─→ 1:Many → property_sales (as seller_id)
    └─→ 1:Many → payments (as business_id)


listings (Property Listings)
    │
    ├─→ 1:1 → hotels (if listing_type='hotel')
    │              │
    │              └─→ 1:Many → rooms
    │
    ├─→ 1:1 → guesthouses (if listing_type='fully_furnished' or 'rental')
    │
    ├─→ 1:Many → bookings (as listing_id)
    │
    └─→ 1:Many → waiting_list (as listing_id)


bookings
    │
    ├─→ Many:1 → profiles (guest_id)
    ├─→ Many:1 → listings (listing_id)
    ├─→ Many:1 → rooms (room_id, optional)
    └─→ 1:Many → payments (as booking_id)


commission_settings (Configuration)
    │
    └─→ Referenced by bookings for commission calculation


SIMPLIFIED DIAGRAM:
───────────────────

auth.users ─┬─ profiles ─┬─ listings ─┬─ hotels ─── rooms
            │            │            │
            │            │            └─ guesthouses
            │            │
            │            ├─ bookings ─── payments
            │            │
            │            ├─ host_requests
            │            │
            │            └─ property_sales


BOOKING FLOW:
─────────────

Guest (profile) → Selects listing → Chooses room → Creates booking → Makes payment
                                                         │
                                                         └─→ Commission calculated
                                                             from commission_settings
```

---

## 6. SECURITY & ACCESS CONTROL

```
┌────────────────────────────────────────────────────────────────────┐
│              ROW LEVEL SECURITY (RLS) FLOW                          │
└────────────────────────────────────────────────────────────────────┘

Query: SELECT * FROM listings
       │
       ▼
   RLS Policies Check
       │
       ├─→ Get current user: auth.uid()
       │
       ├─→ Get user role:
       │   (SELECT role FROM profiles WHERE id = auth.uid())
       │
       ├─→ Apply policies:
       │
       │   Policy 1: "Public can view approved listings"
       │   USING (
       │     approval_status = 'approved'
       │     AND is_active = true
       │   )
       │
       │   Policy 2: "Hosts can view own listings"
       │   USING (host_id = auth.uid())
       │
       │   Policy 3: "Admins can view all listings"
       │   USING (
       │     (SELECT role FROM profiles WHERE id = auth.uid())
       │     IN ('admin', 'super_admin')
       │   )
       │
       ├─→ Combine policies (OR logic)
       │
       └─→ Return only rows matching policies


JWT Token Structure:
────────────────────

{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "aud": "authenticated",
  "role": "authenticated",  ← Supabase auth role (always 'authenticated')
  "app_metadata": {
    "provider": "email",
    "role": "guest"         ← OUR custom role ✅
  },
  "user_metadata": {
    "full_name": "John Doe"
  },
  "exp": 1234567890
}


How RLS Uses JWT:
─────────────────

-- Get user ID
auth.uid() → Returns JWT.sub

-- Get custom role (Method 1 - From JWT)
(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role'

-- Get custom role (Method 2 - From profiles table)
(SELECT role FROM profiles WHERE id = auth.uid())

⚠️ Method 1 is faster but requires JWT to be up-to-date
⚠️ Method 2 is slower but always current (causes N+1 queries)
```

---

## 7. COMMISSION CALCULATION

```
┌────────────────────────────────────────────────────────────────────┐
│              COMMISSION CALCULATION FLOW                            │
└────────────────────────────────────────────────────────────────────┘

Booking Created
    │
    ├─→ total_price = $320
    ├─→ property_type = 'hotel'
    │
    ▼
TRIGGER: set_booking_commission()
    │
    ├─→ Calls: calculate_booking_commission('hotel', 320)
    │
    ▼
FUNCTION: calculate_booking_commission()
    │
    ├─→ Query commission_settings:
    │   SELECT commission_rate
    │   FROM commission_settings
    │   WHERE property_type = 'hotel'
    │     AND is_active = true
    │
    ├─→ Returns: 10.00 (10%)
    │
    ├─→ Calculate:
    │   commission_amount = 320 × (10.00 / 100)
    │                     = 320 × 0.10
    │                     = $32.00
    │
    ▼
Update Booking
    │
    ├─→ UPDATE bookings
    │   SET commission_amount = 32.00
    │   WHERE id = new_booking_id
    │
    └─→ Saved ✅


Payout Breakdown:
─────────────────

Total Price:        $320.00
Commission (10%):   - $32.00
                    ─────────
Host Receives:       $288.00
Platform Receives:    $32.00


Commission Rates by Property Type:
───────────────────────────────────

┌─────────────────┬──────────────┬─────────────┐
│ Property Type   │ Commission % │ Example     │
├─────────────────┼──────────────┼─────────────┤
│ hotel           │ 10%          │ $100 → $10  │
│ fully_furnished │  8%          │ $100 → $8   │
│ rental          │  5%          │ $100 → $5   │
│ property_sales  │  3%          │ $10k → $300 │
└─────────────────┴──────────────┴─────────────┘
```

---

**Waxa halkan ka muuqanaya sida system-ku u shaqeeyo oo dhamaystiran!**

**Haddii aad wax su'aalo ah ka qabto ama aad rabto sharaxaad dheeraad ah, ii sheeg!**