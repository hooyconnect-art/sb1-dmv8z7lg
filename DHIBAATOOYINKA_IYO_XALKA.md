# DHIBAATOOYINKA (ISSUES) IYO XALKA (SOLUTIONS)

> Quick Reference Guide - Cilado badan oo system-ka ka dhaca iyo sida loo xaliyo

---

## 🔴 DHIBAATO #1: Role Change Ma Shaqeyneyso

### Calaamadaha:
```
✅ Admin changes user role from 'guest' to 'host'
✅ Database updated successfully
❌ User still sees guest dashboard
❌ User cannot create listings
```

### Sababta:
- JWT token contains old role
- Token doesn't auto-refresh
- User needs to re-login

### Xalka:
```
OPTION 1 (Degdeg): User must logout and login again
OPTION 2 (Better): Add this code to AuthContext:

// In contexts/AuthContext.tsx
useEffect(() => {
  const checkRoleChange = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const jwtRole = user.app_metadata?.role;

    if (profile?.role !== jwtRole) {
      // Force re-login
      await supabase.auth.signOut();
      router.push('/login?message=role-changed');
    }
  };

  // Check every 5 seconds
  const interval = setInterval(checkRoleChange, 5000);
  return () => clearInterval(interval);
}, [user]);
```

---

## 🔴 DHIBAATO #2: Listing La Approve Gareeyey Ma Muuqaneyso

### Calaamadaha:
```
✅ Admin approves listing
✅ approval_status = 'approved'
❌ Listing doesn't appear in /properties page
❌ Public cannot see it
```

### Sababta:
```sql
-- Listing needs 3 conditions to be visible:
1. approval_status = 'approved' ✅
2. is_active = true ❌ (Often false!)
3. is_available = true ❌ (For bookings)
```

### Xalka DEGDEG:
```sql
-- Manually activate all approved listings
UPDATE listings
SET is_active = true,
    is_available = true
WHERE approval_status = 'approved'
  AND is_active = false;
```

### Xalka JOOGTO AH:
```sql
-- Add trigger to auto-activate
CREATE OR REPLACE FUNCTION auto_activate_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    NEW.is_active := true;
    NEW.is_available := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_activate_trigger
BEFORE UPDATE ON listings
FOR EACH ROW
WHEN (NEW.approval_status = 'approved' AND OLD.approval_status != 'approved')
EXECUTE FUNCTION auto_activate_on_approval();
```

---

## 🔴 DHIBAATO #3: Double Booking (Hotel Room)

### Calaamadaha:
```
✅ Hotel has 5 double rooms
✅ All 5 rooms booked for Jan 1-5
❌ System allows 6th booking for same dates
❌ Overbooking occurs
```

### Sababta:
- No availability validation
- No conflict checking
- Quantity not considered

### Xalka:
```sql
-- Step 1: Create availability check function
CREATE OR REPLACE FUNCTION check_room_availability(
  p_room_id UUID,
  p_check_in TIMESTAMPTZ,
  p_check_out TIMESTAMPTZ
)
RETURNS TABLE(available BOOLEAN, booked INTEGER, total INTEGER) AS $$
DECLARE
  v_total_quantity INTEGER;
  v_booked_count INTEGER;
BEGIN
  -- Get room quantity
  SELECT quantity INTO v_total_quantity
  FROM rooms
  WHERE id = p_room_id;

  -- Count overlapping bookings
  SELECT COUNT(*) INTO v_booked_count
  FROM bookings
  WHERE room_id = p_room_id
    AND status IN ('pending', 'confirmed')
    AND (check_in, check_out) OVERLAPS (p_check_in, p_check_out);

  RETURN QUERY SELECT
    (v_booked_count < v_total_quantity) as available,
    v_booked_count as booked,
    v_total_quantity as total;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Use in frontend before booking
```

```typescript
// In booking form component
const validateAvailability = async () => {
  const { data, error } = await supabase
    .rpc('check_room_availability', {
      p_room_id: selectedRoom.id,
      p_check_in: checkInDate,
      p_check_out: checkOutDate
    });

  if (!data[0].available) {
    alert(`Only ${data[0].total - data[0].booked} rooms available!`);
    return false;
  }
  return true;
};

// Before creating booking
if (!(await validateAvailability())) {
  return; // Stop booking
}
```

---

## 🔴 DHIBAATO #4: Admin Stats Ma Soo Muuqaneyso

### Calaamadaha:
```
❌ /admin dashboard empty
❌ "Loading..." never stops
❌ No error messages
```

### Sababta:
```
1. Admin role not in JWT (user needs re-login)
2. RLS blocking queries
3. API route using wrong Supabase client
```

### Xalka:
```typescript
// Check 1: Verify user is admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

console.log('User role:', profile?.role);

// Check 2: Verify JWT has role
console.log('JWT role:', user.app_metadata?.role);

// If different → Force re-login

// Check 3: Use service role in API route
// File: app/api/admin/stats/route.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ⚠️ Server-side only!
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Now queries work without RLS
const { data: stats } = await supabaseAdmin
  .from('listings')
  .select('*');
```

---

## 🔴 DHIBAATO #5: Suspended User Wali Geli Karaa System-ka

### Calaamadaha:
```
✅ Admin suspends user (status='suspended')
✅ Database updated
❌ User can still login
❌ User can still use system
```

### Sababta:
- Status check not enforced
- No validation at login
- RLS doesn't block suspended users

### Xalka:
```sql
-- Option 1: Add RLS policy to block everything
CREATE POLICY "Block suspended users"
ON profiles
FOR ALL
TO authenticated
USING (
  -- Allow viewing own profile even if suspended
  (id = auth.uid())
  OR
  -- Allow access if not suspended
  (
    (SELECT status FROM profiles WHERE id = auth.uid()) != 'suspended'
  )
);

-- Option 2: Check at login (better)
-- Add to AuthContext.tsx
```

```typescript
// In AuthContext after login
useEffect(() => {
  if (user) {
    supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data?.status === 'suspended') {
          alert('Your account has been suspended');
          supabase.auth.signOut();
          router.push('/login');
        }
      });
  }
}, [user]);
```

---

## 🔴 DHIBAATO #6: Commission Ma Xisaabtamayso

### Calaamadaha:
```
✅ Booking created successfully
❌ commission_amount = 0 or NULL
❌ Should be auto-calculated
```

### Sababta:
```
1. Trigger not firing
2. property_type mismatch
3. No commission_settings for that type
```

### Xalka:
```sql
-- Check 1: Does trigger exist?
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'bookings'::regclass
  AND tgname LIKE '%commission%';

-- Check 2: Test function manually
SELECT calculate_booking_commission('hotel', 100.00);
-- Should return 10.00 (if hotel commission is 10%)

-- Check 3: View commission settings
SELECT * FROM commission_settings;

-- Fix: Manually calculate for existing bookings
UPDATE bookings
SET commission_amount = (
  total_price * (
    SELECT commission_rate / 100
    FROM commission_settings
    WHERE property_type = (
      SELECT listing_type FROM listings WHERE id = bookings.listing_id
    )
  )
)
WHERE commission_amount IS NULL OR commission_amount = 0;

-- Fix: Ensure property_type is set
UPDATE bookings
SET property_type = (
  SELECT listing_type FROM listings WHERE id = bookings.listing_id
)
WHERE property_type IS NULL;
```

---

## 🔴 DHIBAATO #7: Images Ma Upload Gareynayaan

### Calaamadaha:
```
✅ Image selected in form
✅ Upload button clicked
❌ Image not appearing
❌ No error shown
```

### Sababta:
```
1. Storage bucket permissions
2. File too large
3. Wrong bucket name
4. URL not saved to database
```

### Xalka:
```typescript
// Proper upload flow
const uploadListingImages = async (files: FileList) => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`File ${file.name} too large (max 5MB)`);
      continue;
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `listings/${fileName}`;

    try {
      // 1. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      uploadedUrls.push(data.publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }

  return uploadedUrls;
};

// Usage in form
const handleSubmit = async () => {
  const imageUrls = await uploadListingImages(files);

  const { error } = await supabase
    .from('hotels')
    .update({ images: imageUrls })
    .eq('id', hotelId);

  if (error) {
    console.error('Failed to save images:', error);
  }
};
```

---

## 🔴 DHIBAATO #8: Slow Performance (Daahdaah)

### Calaamadaha:
```
❌ /properties page takes 5+ seconds to load
❌ Admin dashboard slow
❌ Search very slow
```

### Sababta:
```
1. No database indexes
2. Loading all data at once
3. N+1 query problem
4. Large image arrays
```

### Xalka:
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_public_view
ON listings (approval_status, is_active, is_available, created_at DESC)
WHERE approval_status = 'approved' AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_listings_host
ON listings (host_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_guest
ON bookings (guest_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_listing
ON bookings (listing_id, check_in, check_out);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hotels_listing
ON hotels (listing_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_hotel
ON rooms (hotel_id);

-- Optimize queries: Use pagination
SELECT l.*, h.name, h.city,
       h.images[1] as thumbnail -- Only first image
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
WHERE l.approval_status = 'approved'
  AND l.is_active = true
ORDER BY l.created_at DESC
LIMIT 20 OFFSET 0; -- Paginate!
```

```typescript
// Frontend: Use pagination
const [page, setPage] = useState(0);
const ITEMS_PER_PAGE = 20;

const { data: listings } = await supabase
  .from('listings')
  .select(`
    *,
    hotels (name, city, images)
  `)
  .eq('approval_status', 'approved')
  .eq('is_active', true)
  .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
```

---

## 🔴 DHIBAATO #9: Payment Manual Waa (Manual Payments)

### Calaamadaha:
```
✅ Guest creates booking
❌ No automated payment
❌ Admin must manually verify
❌ Slow process
```

### Sababta:
- No payment gateway integration
- System designed for manual payments

### Xalka (Future Enhancement):
```typescript
// Integration with Somali payment providers
// Option 1: Waafi Pay API
// Option 2: eDahab API
// Option 3: EVC Plus API

const processPayment = async (amount: number, phone: string) => {
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      phone,
      provider: 'evc_plus'
    })
  });

  const { transaction_id } = await response.json();

  // Update booking
  await supabase
    .from('payments')
    .insert({
      booking_id: bookingId,
      transaction_id,
      amount,
      payment_method: 'evc_plus',
      payment_status: 'pending'
    });

  // Poll for payment confirmation
  const checkPayment = setInterval(async () => {
    const status = await fetch(`/api/payments/status/${transaction_id}`);
    const { paid } = await status.json();

    if (paid) {
      clearInterval(checkPayment);
      updateBookingStatus(bookingId, 'confirmed');
    }
  }, 5000);
};
```

---

## 🔴 DHIBAATO #10: User Ma Create Gareeyn Karo Admin

### Calaamadaha:
```
❌ Admin tries to create new user
❌ Form submits but no user created
❌ Error: "Email already exists" (but doesn't)
```

### Sababta:
```
1. Using wrong Supabase client
2. Need service role key for admin operations
3. RLS blocking insertions
```

### Xalka:
```typescript
// Must use admin client in API route
// File: app/api/users/create/route.ts

import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { email, password, full_name, role } = await request.json();

  // Create admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm
    user_metadata: { full_name },
    app_metadata: { role }
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }

  // Create profile (should be auto-created by trigger, but check)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', authUser.user.id)
    .single();

  if (!profile) {
    // Trigger didn't fire, create manually
    await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        role
      });
  }

  return Response.json({ success: true, user: authUser.user });
}
```

---

## ✅ SUMMARY - Xal Degdeg Ah

| Dhibaato | Xal Degdeg | Xal Joogto Ah |
|----------|-----------|---------------|
| Role change delay | User re-login | Auto JWT refresh |
| Approved listing hidden | Manual activate | Auto-activate trigger |
| Double booking | Manual check | Availability function |
| Stats not loading | Use service role | Fix RLS policies |
| Suspended user login | Manual check | Login validation |
| Commission = 0 | Manual update | Fix trigger |
| Images not uploading | Check permissions | Proper upload code |
| Slow performance | Add pagination | Add indexes |
| Manual payments | Admin verification | Payment gateway |
| Can't create user | Use admin client | API route fix |

---

## 🛠️ DEBUGGING COMMANDS

```sql
-- Check user role
SELECT id, email, role, status FROM profiles WHERE email = 'user@example.com';

-- Check JWT metadata
SELECT id, email, raw_app_meta_data FROM auth.users WHERE email = 'user@example.com';

-- Check listing visibility
SELECT id, approval_status, is_active, is_available FROM listings WHERE id = 'xxx';

-- Check bookings for room
SELECT * FROM bookings WHERE room_id = 'xxx' AND status IN ('pending', 'confirmed');

-- Check commission settings
SELECT * FROM commission_settings;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies WHERE tablename = 'profiles';

-- Check triggers
SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'bookings'::regclass;

-- Check indexes
SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public';
```

---

**Halkan waxaad ka heshaa xalka degdeg ah ee dhibaatooyinka ugu badan!**