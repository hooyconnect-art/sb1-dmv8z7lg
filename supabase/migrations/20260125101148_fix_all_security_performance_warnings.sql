/*
  # Fix All Supabase Security and Performance Warnings

  ## Issues Fixed
  1. **Auth Re-evaluation** - 21 policies across 9 tables
     - Wrap all auth.uid() and auth.jwt() with (SELECT ...)
  2. **Unused Indexes** - 20 unused indexes consuming space
  3. **Multiple Permissive Policies** - Consolidate 2 UPDATE policies on listings
  4. **Security Definer Views** - Remove SECURITY DEFINER from views
  
  ## Tables Updated
  - listings (5 policies + consolidation)
  - payments (4 policies)
  - bookings (3 policies)
  - property_sales (3 policies)
  - commission_settings (3 policies)
  - sales_inquiries (1 policy)
  - hotels (1 policy)
  - guesthouses (1 policy)
  - rooms (1 policy)
*/

-- =====================================================
-- PART 1: FIX LISTINGS POLICIES (5 policies + consolidation)
-- =====================================================

DROP POLICY IF EXISTS "Authenticated can view listings" ON listings;
DROP POLICY IF EXISTS "Hosts and admins can create listings" ON listings;
DROP POLICY IF EXISTS "Admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Hosts can update own listings" ON listings;
DROP POLICY IF EXISTS "Admins can delete listings" ON listings;

-- SELECT policy with wrapped auth functions
CREATE POLICY "Authenticated can view listings"
  ON listings
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR approval_status = 'approved'
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- INSERT policy with wrapped auth functions
CREATE POLICY "Hosts and admins can create listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- CONSOLIDATED UPDATE policy (fixes multiple permissive policies warning)
CREATE POLICY "Users can update listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- DELETE policy with wrapped auth functions
CREATE POLICY "Admins can delete listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 2: FIX PAYMENTS POLICIES (4 policies)
-- =====================================================

DROP POLICY IF EXISTS "Payments view policy" ON payments;
DROP POLICY IF EXISTS "Payments insert policy" ON payments;
DROP POLICY IF EXISTS "Payments update policy" ON payments;
DROP POLICY IF EXISTS "Payments delete policy" ON payments;

CREATE POLICY "Payments view policy" ON payments 
  FOR SELECT 
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE guest_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments insert policy" ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments update policy" ON payments
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments delete policy" ON payments
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 3: FIX BOOKINGS POLICIES (3 policies)
-- =====================================================

DROP POLICY IF EXISTS "Bookings insert policy" ON bookings;
DROP POLICY IF EXISTS "Bookings select policy" ON bookings;
DROP POLICY IF EXISTS "Bookings update policy" ON bookings;

CREATE POLICY "Bookings insert policy" ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    guest_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Bookings select policy" ON bookings
  FOR SELECT
  TO authenticated
  USING (
    guest_id = (SELECT auth.uid())
    OR listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Bookings update policy" ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 4: FIX PROPERTY_SALES POLICIES (3 policies)
-- =====================================================

DROP POLICY IF EXISTS "Property sales insert policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales select policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales update policy" ON property_sales;

CREATE POLICY "Property sales insert policy" ON property_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Property sales select policy" ON property_sales
  FOR SELECT
  TO authenticated
  USING (
    status = 'available'
    OR seller_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Property sales update policy" ON property_sales
  FOR UPDATE
  TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 5: FIX COMMISSION_SETTINGS POLICIES (3 policies)
-- =====================================================

DROP POLICY IF EXISTS "Commission settings insert policy" ON commission_settings;
DROP POLICY IF EXISTS "Commission settings update policy" ON commission_settings;
DROP POLICY IF EXISTS "Commission settings delete policy" ON commission_settings;

CREATE POLICY "Commission settings insert policy" ON commission_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Commission settings update policy" ON commission_settings
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Commission settings delete policy" ON commission_settings
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 6: FIX SALES_INQUIRIES POLICY (1 policy)
-- =====================================================

DROP POLICY IF EXISTS "Sales inquiries select policy" ON sales_inquiries;

CREATE POLICY "Sales inquiries select policy" ON sales_inquiries
  FOR SELECT
  TO authenticated
  USING (
    property_sale_id IN (
      SELECT id FROM property_sales WHERE seller_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 7: FIX HOTELS POLICY (1 policy)
-- =====================================================

DROP POLICY IF EXISTS "Users can view hotels" ON hotels;

CREATE POLICY "Users can view hotels"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    (SELECT l.approval_status FROM listings l WHERE l.id = hotels.listing_id) = 'approved'
    OR (SELECT l.host_id FROM listings l WHERE l.id = hotels.listing_id) = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 8: FIX GUESTHOUSES POLICY (1 policy)
-- =====================================================

DROP POLICY IF EXISTS "Users can view guesthouses" ON guesthouses;

CREATE POLICY "Users can view guesthouses"
  ON guesthouses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT l.approval_status FROM listings l WHERE l.id = guesthouses.listing_id) = 'approved'
    OR (SELECT l.host_id FROM listings l WHERE l.id = guesthouses.listing_id) = (SELECT auth.uid())
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 9: FIX ROOMS POLICY (1 policy)
-- =====================================================

DROP POLICY IF EXISTS "Users can view rooms" ON rooms;

CREATE POLICY "Users can view rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM hotels h
      JOIN listings l ON l.id = h.listing_id
      WHERE h.id = rooms.hotel_id
        AND l.approval_status = 'approved'
    )
    OR EXISTS (
      SELECT 1
      FROM hotels h
      JOIN listings l ON l.id = h.listing_id
      WHERE h.id = rooms.hotel_id
        AND l.host_id = (SELECT auth.uid())
    )
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 10: DROP UNUSED INDEXES
-- =====================================================

-- Foreign key indexes (unused)
DROP INDEX IF EXISTS idx_bookings_listing_id;
DROP INDEX IF EXISTS idx_bookings_room_id;
DROP INDEX IF EXISTS idx_payments_booking_id;
DROP INDEX IF EXISTS idx_payments_business_id;
DROP INDEX IF EXISTS idx_sales_inquiries_property_sale_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_collection_schedules_driver_id;
DROP INDEX IF EXISTS idx_collection_schedules_vehicle_id;
DROP INDEX IF EXISTS idx_collection_schedules_zone_id;
DROP INDEX IF EXISTS idx_collections_driver_id;
DROP INDEX IF EXISTS idx_collections_schedule_id;
DROP INDEX IF EXISTS idx_complaints_assigned_to;
DROP INDEX IF EXISTS idx_complaints_user_id;
DROP INDEX IF EXISTS idx_complaints_zone_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_waste_bins_zone_id;
DROP INDEX IF EXISTS idx_zones_district_id;

-- Other unused indexes
DROP INDEX IF EXISTS idx_listings_status_active;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_payments_status;

-- =====================================================
-- PART 11: FIX SECURITY DEFINER VIEWS
-- =====================================================

-- Drop and recreate bookable_listings without SECURITY DEFINER
DROP VIEW IF EXISTS bookable_listings;

CREATE VIEW bookable_listings AS
SELECT 
  l.id,
  l.listing_type,
  l.is_available,
  l.status,
  l.approval_status,
  l.is_active,
  l.created_at,
  h.name as hotel_name,
  h.city as hotel_city,
  g.title as guesthouse_title,
  g.city as guesthouse_city,
  g.price as guesthouse_price
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
LEFT JOIN guesthouses g ON g.listing_id = l.id
WHERE l.approval_status = 'approved' 
  AND l.is_active = true 
  AND l.is_available = true;

-- Drop and recreate inquiry_listings without SECURITY DEFINER
DROP VIEW IF EXISTS inquiry_listings;

CREATE VIEW inquiry_listings AS
SELECT 
  l.id,
  l.listing_type,
  l.host_id,
  l.status,
  l.approval_status,
  h.name as hotel_name,
  h.city as hotel_city,
  g.title as guesthouse_title,
  g.city as guesthouse_city
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
LEFT JOIN guesthouses g ON g.listing_id = l.id
WHERE l.approval_status = 'approved' 
  AND l.is_active = true;
