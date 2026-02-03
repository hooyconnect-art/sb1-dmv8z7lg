/*
  # Fix Hotels, Guesthouses, and Rooms Visibility

  ## Problem
  Inconsistent column usage between anon and authenticated policies:
  - Anon policies check `approval_status`
  - Authenticated policies check `status`
  
  ## Solution
  Make all SELECT policies use `approval_status` consistently
  
  ## Changes
  1. Update hotels SELECT policy to use approval_status
  2. Update guesthouses SELECT policy to use approval_status
  3. Update rooms SELECT policy to use approval_status
*/

-- =====================================================
-- HOTELS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view hotels" ON hotels;

CREATE POLICY "Users can view hotels"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    (SELECT l.approval_status FROM listings l WHERE l.id = hotels.listing_id) = 'approved'
    OR (SELECT l.host_id FROM listings l WHERE l.id = hotels.listing_id) = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- GUESTHOUSES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view guesthouses" ON guesthouses;

CREATE POLICY "Users can view guesthouses"
  ON guesthouses
  FOR SELECT
  TO authenticated
  USING (
    (SELECT l.approval_status FROM listings l WHERE l.id = guesthouses.listing_id) = 'approved'
    OR (SELECT l.host_id FROM listings l WHERE l.id = guesthouses.listing_id) = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- ROOMS TABLE
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
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );
