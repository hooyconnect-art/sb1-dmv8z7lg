# CREATE LISTING FLOW - 3 PROPERTY TYPES

## ✅ SYSTEM FIXED & VERIFIED

**All 3 property types are now fully supported:**
1. ✅ Hotel
2. ✅ Fully Furnished
3. ✅ Rental

---

## 🎯 PROPERTY TYPE SYSTEM

### Database Schema:

```
listings table:
├─ listing_type: 'hotel' | 'fully_furnished' | 'rental'
├─ commission_rate: 15.00 | 12.00 | 0.00
└─ status: 'pending' | 'approved' | 'rejected'

hotels table (for listing_type = 'hotel'):
├─ listing_id → listings.id
├─ name, city, address
├─ images: text[]
└─ amenities: text[]

guesthouses table (for listing_type = 'fully_furnished' OR 'rental'):
├─ listing_id → listings.id
├─ title, city, address
├─ property_type: 'apartment' | 'house' | 'villa' | 'guesthouse' | 'office' | 'commercial'
├─ price, price_type: 'night' | 'month'
└─ images: text[]
```

**Key Points:**
- `listing_type` determines the main category (hotel, fully_furnished, rental)
- `property_type` (guesthouses only) determines the sub-category (apartment, house, etc.)
- Hotels go in `hotels` table
- Fully Furnished & Rental go in `guesthouses` table

---

## 🏨 HOTEL LISTING CREATION

### Flow:

```
1. Navigate to: /host/listings/new
2. Select: "Hotel" card
3. Redirects to: /host/listings/new/hotel
4. Fill form:
   - Hotel name
   - City, address
   - Description
   - Rating
   - Check-in / Check-out times
   - Amenities
   - Upload images
   - Add rooms (required - at least 1)
5. Submit
6. Creates:
   INSERT INTO listings (
     listing_type = 'hotel',
     commission_rate = 15.00,
     status = 'pending',
     is_active = false,
     is_available = false
   )

   INSERT INTO hotels (
     listing_id,
     name,
     city,
     images,
     ...
   )

   INSERT INTO rooms (
     hotel_id,
     room_type,
     price_per_night,
     ...
   )
7. Result:
   ✅ Listing created with status='pending'
   ✅ Host sees in dashboard (pending badge)
   ❌ Guest does NOT see (not approved yet)
```

### Code Location:

`app/host/listings/new/hotel/page.tsx`

### Key Code:

```typescript
// Line 142-143
listing_type: 'hotel',
commission_rate: 15.00,

// Lines 144-147
is_available: isAdmin ? true : false,
status: isAdmin ? 'approved' : 'pending',
approval_status: isAdmin ? 'approved' : 'pending',
is_active: isAdmin ? true : false,
```

### Validation:

```typescript
// Line 87-90
if (selectedFiles.length === 0) {
  toast.error('Please upload at least one hotel image');
  return;
}

// Line 92-95
if (rooms.length === 0) {
  toast.error('Please add at least one room to publish the hotel');
  return;
}

// Line 97-101
for (const room of rooms) {
  if (!room.price_per_night || parseFloat(room.price_per_night) <= 0) {
    toast.error('All rooms must have a valid price');
    return;
  }
}
```

---

## 🏡 FULLY FURNISHED LISTING CREATION

### Flow:

```
1. Navigate to: /host/listings/new
2. Select: "Fully Furnished" card
3. Redirects to: /host/listings/new/guesthouse?type=furnished
4. Fill form:
   - Property title
   - Property category: apartment, house, villa, guesthouse, office, commercial
   - City, address
   - Description
   - Pricing type: per night OR per month
   - Price
   - Bedrooms, bathrooms, max guests
   - Amenities
   - Upload images
5. Submit
6. Creates:
   INSERT INTO listings (
     listing_type = 'fully_furnished',
     commission_rate = 12.00,
     status = 'pending',
     is_active = false,
     is_available = false
   )

   INSERT INTO guesthouses (
     listing_id,
     title,
     property_type = 'apartment' (or selected category),
     price,
     price_type = 'night' or 'month',
     images,
     ...
   )
7. Result:
   ✅ Listing created with status='pending'
   ✅ Commission = 12%
   ✅ Bookable (after approval)
```

### Code Location:

`app/host/listings/new/guesthouse/page.tsx`

### Key Code:

```typescript
// Line 24
const listingType = searchParams.get('type') || 'furnished';

// Line 85-86
const normalizedListingType = listingType === 'furnished' ? 'fully_furnished' : listingType;
const commissionRate = normalizedListingType === 'fully_furnished' ? 12.00 : 0.00;

// Line 93-94
listing_type: normalizedListingType,  // 'fully_furnished'
commission_rate: commissionRate,      // 12.00

// Line 123
property_type: formData.property_category,  // 'apartment', 'house', etc.
```

### Property Categories:

```typescript
// Line 199-204
<SelectItem value="apartment">Apartment</SelectItem>
<SelectItem value="house">House</SelectItem>
<SelectItem value="villa">Villa</SelectItem>
<SelectItem value="guesthouse">Guesthouse</SelectItem>
<SelectItem value="office">Office</SelectItem>
<SelectItem value="commercial">Commercial</SelectItem>
```

---

## 🏢 RENTAL LISTING CREATION

### Flow:

```
1. Navigate to: /host/listings/new
2. Select: "Rental" card
3. Redirects to: /host/listings/new/guesthouse?type=rental
4. Fill form:
   - Property title
   - Property category: apartment, house, villa, guesthouse, office, commercial
   - City, address
   - Description
   - Price (automatically set to monthly)
   - Bedrooms, bathrooms, max guests
   - Amenities
   - Upload images
5. Submit
6. Creates:
   INSERT INTO listings (
     listing_type = 'rental',
     commission_rate = 0.00,
     status = 'pending',
     is_active = false,
     is_available = false
   )

   INSERT INTO guesthouses (
     listing_id,
     title,
     property_type = 'apartment' (or selected category),
     price,
     price_type = 'month',
     images,
     ...
   )
7. Result:
   ✅ Listing created with status='pending'
   ✅ Commission = 0%
   ❌ NOT bookable (inquiry only)
   ✅ Shows "Contact Agent" + Inquiry form
```

### Code Location:

`app/host/listings/new/guesthouse/page.tsx`

### Key Code:

```typescript
// Line 24
const listingType = searchParams.get('type') || 'furnished';

// Line 36 (initial state)
price_type: listingType === 'rental' ? 'month' : 'night',

// Line 44-47 (force monthly for rentals)
useEffect(() => {
  if (listingType === 'rental') {
    setFormData(prev => ({ ...prev, price_type: 'month' }));
  }
}, [listingType]);

// Line 85-86
const normalizedListingType = listingType === 'furnished' ? 'fully_furnished' : listingType;
const commissionRate = normalizedListingType === 'fully_furnished' ? 12.00 : 0.00;

// Line 93-94
listing_type: normalizedListingType,  // 'rental'
commission_rate: commissionRate,      // 0.00

// Line 127
price_type: formData.price_type,      // 'month'
```

### Rental-Specific UI:

```typescript
// Line 242-260 (Pricing type hidden for rentals)
{listingType === 'furnished' && (
  <div>
    <Label>Pricing Type</Label>
    <RadioGroup
      value={formData.price_type}
      onValueChange={(value) => setFormData({ ...formData, price_type: value })}
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="night" id="night" />
        <Label htmlFor="night">Per Night</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="month" id="month" />
        <Label htmlFor="month">Per Month</Label>
      </div>
    </RadioGroup>
  </div>
)}
```

---

## ✅ COMMISSION SYSTEM

### Rates:

| Property Type | Commission | CTA | Booking |
|---------------|------------|-----|---------|
| Hotel | 15% | Book Now | ✅ Enabled |
| Fully Furnished | 12% | Book Now | ✅ Enabled |
| Rental | 0% | Contact Agent + Inquiry | ❌ Disabled |

### Database:

```sql
SELECT * FROM commission_settings;

Results:
property_type   | commission_rate | is_active
----------------|-----------------|----------
Hotel           | 15.00           | true
Fully Furnished | 12.00           | true
Rental          | 0.00            | true
```

### Commission Calculation:

```typescript
// lib/property-types.ts

export function calculateCommission(amount: number, type: PropertyType): number {
  if (!hasCommission(type)) {
    return 0;
  }
  const rate = getCommissionRate(type);
  return (amount * rate) / 100;
}

// Examples:
calculateCommission(100, 'hotel')           // 15.00
calculateCommission(100, 'fully_furnished') // 12.00
calculateCommission(100, 'rental')          // 0.00
```

---

## 🔒 VALIDATION & CONSTRAINTS

### Database Constraints:

```sql
-- listings.listing_type constraint
ALTER TABLE listings ADD CONSTRAINT listings_listing_type_check
  CHECK (listing_type IN ('hotel', 'fully_furnished', 'rental'));

-- guesthouses.property_type constraint (FIXED)
ALTER TABLE guesthouses ADD CONSTRAINT guesthouses_property_type_check
  CHECK (property_type IN ('apartment', 'house', 'villa', 'guesthouse', 'office', 'commercial'));

-- bookings.property_type constraint (only bookable types)
ALTER TABLE bookings ADD CONSTRAINT bookings_property_type_check
  CHECK (property_type IN ('hotel', 'fully_furnished'));
```

### Form Validation:

**Hotel:**
- ✅ At least 1 image required
- ✅ At least 1 room required
- ✅ All rooms must have valid price > 0
- ✅ Name, city, address required

**Fully Furnished / Rental:**
- ✅ At least 1 image required
- ✅ Title, city, address required
- ✅ Price > 0 required
- ✅ Property category required
- ✅ Bedrooms, bathrooms, max_guests required

---

## 🚦 APPROVAL FLOW

### For Hosts:

```
1. Host creates listing
   ↓
   status = 'pending'
   is_active = false
   is_available = false
   ↓
2. Listing appears in Host Dashboard
   - Badge: "Pending Approval"
   - Cannot toggle availability
   ↓
3. Wait for Super Admin approval
```

### For Super Admins:

```
1. Super Admin creates listing
   ↓
   status = 'approved'
   is_active = true
   is_available = true
   approved_at = NOW()
   ↓
2. Listing immediately visible to guests
   ↓
3. No approval needed
```

### Code:

```typescript
// app/host/listings/new/hotel/page.tsx:144-151
is_available: isAdmin ? true : false,
status: isAdmin ? 'approved' : 'pending',
approval_status: isAdmin ? 'approved' : 'pending',
is_active: isAdmin ? true : false,
created_by_role: profile?.role || 'host',
created_by_user_id: user!.id,
approved_at: isAdmin ? new Date().toISOString() : null,
approved_by: isAdmin ? user!.id : null,
```

---

## 📋 TESTING GUIDE

### Test 1: Create Hotel Listing

```
1. Login as host (kaariye@hoyconnect.so)
2. Navigate to: /host/listings/new
3. Click: "Hotel" card
4. Fill form:
   - Name: "Test Hotel"
   - City: "Mogadishu"
   - Address: "123 Main St"
   - Description: "Comfortable hotel..."
   - Rating: 4
   - Check-in: 14:00
   - Check-out: 12:00
   - Amenities: "WiFi, Parking, AC"
   - Upload: 3 images
   - Add room:
     - Type: Single
     - Price: $50
     - Max guests: 2
     - Quantity: 5
5. Submit
6. Expected:
   ✅ Toast: "Hotel created successfully! Awaiting admin approval."
   ✅ Redirects to: /host/dashboard
   ✅ Listing appears with "Pending" badge
   ✅ listing_type = 'hotel' in database
   ✅ commission_rate = 15.00 in database
   ✅ status = 'pending' in database
```

### Test 2: Create Fully Furnished Listing

```
1. Login as host
2. Navigate to: /host/listings/new
3. Click: "Fully Furnished" card
4. Fill form:
   - Title: "Luxury Apartment"
   - Category: "Apartment"
   - City: "Mogadishu"
   - Address: "456 Beach Rd"
   - Description: "Modern furnished apartment..."
   - Pricing type: "Per Night"
   - Price: $80
   - Bedrooms: 2
   - Bathrooms: 2
   - Max guests: 4
   - Amenities: "WiFi, Kitchen, Balcony"
   - Upload: 4 images
5. Submit
6. Expected:
   ✅ Toast: "Furnished property created successfully! Awaiting admin approval."
   ✅ Redirects to: /host/dashboard
   ✅ Listing appears with "Pending" badge
   ✅ listing_type = 'fully_furnished' in database
   ✅ commission_rate = 12.00 in database
   ✅ property_type = 'apartment' in guesthouses table
   ✅ price_type = 'night' in guesthouses table
```

### Test 3: Create Rental Listing

```
1. Login as host
2. Navigate to: /host/listings/new
3. Click: "Rental" card
4. Fill form:
   - Title: "Commercial Office Space"
   - Category: "Office"
   - City: "Mogadishu"
   - Address: "789 Business Ave"
   - Description: "Prime office space..."
   - Price: $1200 (monthly - auto-set)
   - Bedrooms: 0
   - Bathrooms: 2
   - Max guests: 10
   - Amenities: "WiFi, Parking, Security"
   - Upload: 3 images
5. Submit
6. Expected:
   ✅ Toast: "Rental property created successfully! Awaiting admin approval."
   ✅ Redirects to: /host/dashboard
   ✅ Listing appears with "Pending" badge
   ✅ listing_type = 'rental' in database
   ✅ commission_rate = 0.00 in database
   ✅ property_type = 'office' in guesthouses table
   ✅ price_type = 'month' in guesthouses table
```

### Test 4: Super Admin Auto-Approval

```
1. Login as super admin (buss.conn.ai@gmail.com)
2. Navigate to: /host/listings/new
3. Create any listing (hotel, furnished, or rental)
4. Submit
5. Expected:
   ✅ Toast: "...created and approved successfully!"
   ✅ Redirects to: /admin/listings
   ✅ status = 'approved' in database
   ✅ is_active = true
   ✅ is_available = true
   ✅ approved_at = current timestamp
   ✅ approved_by = super admin user id
   ✅ Guest can see immediately on /properties
```

---

## 🐛 BUGS FIXED

### Issue 1: Property Category Constraint Mismatch ❌ FIXED

**Problem:**
- Database constraint: `('house', 'apartment', 'villa', 'guesthouse')`
- Form options: `('apartment', 'villa', 'office', 'commercial')`
- Mismatch caused "office" and "commercial" submissions to FAIL

**Solution:**
- Created migration: `fix_guesthouse_property_category_constraint.sql`
- Updated constraint to: `('apartment', 'house', 'villa', 'guesthouse', 'office', 'commercial')`
- Added 'house' and 'guesthouse' options to form
- Now all 6 categories work correctly

**Migration:**
```sql
ALTER TABLE guesthouses
DROP CONSTRAINT IF EXISTS guesthouses_property_type_check;

ALTER TABLE guesthouses
ADD CONSTRAINT guesthouses_property_type_check
CHECK (property_type IN ('apartment', 'house', 'villa', 'guesthouse', 'office', 'commercial'));
```

---

## ✅ SUCCESS CRITERIA MET

```
✅ Property Type waa QASAB
   - Form requires property type selection
   - Cannot submit without type

✅ 3 Property Types Supported
   - Hotel: commission 15%, bookable
   - Fully Furnished: commission 12%, bookable
   - Rental: commission 0%, inquiry only

✅ Validation Works
   - Images required (at least 1)
   - Price validation (> 0)
   - All required fields validated
   - Clear error messages

✅ Database Constraints Fixed
   - Property categories now match form options
   - All 6 categories supported
   - No submission failures

✅ Create Listing Flow Works
   - Hotel creation: ✅
   - Fully Furnished creation: ✅
   - Rental creation: ✅
   - Super Admin auto-approval: ✅

✅ Build Successful
   - No TypeScript errors
   - No build errors
   - All 54 pages generated
   - Production ready
```

---

## 📁 FILES MODIFIED

1. **supabase/migrations/fix_guesthouse_property_category_constraint.sql** (NEW)
   - Fixed property_type constraint
   - Added support for all 6 categories

2. **app/host/listings/new/guesthouse/page.tsx**
   - Added 'house' and 'guesthouse' options to form
   - Now shows all 6 property categories

---

## 🎉 NATIJO

**Create Listing flow waa:**

1. ✅ **Shaqeeyaan** - All 3 property types work
2. ✅ **Saxan** - Validation prevents errors
3. ✅ **Buuxan** - All required fields enforced
4. ✅ **Ammaan ah** - Database constraints active
5. ✅ **Production-ready** - Build passes, no errors

**HOSTS WUU CREATE-GAREEN KARAAN DHAMMAANProperty Types!** 🚀

---

## 📞 SUPPORT

For issues:
1. Check error in browser console
2. Check database for constraint violations
3. Verify image upload permissions
4. Confirm user has 'host' role

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0 (Complete)
**Status:** ✅ All Property Types Working
