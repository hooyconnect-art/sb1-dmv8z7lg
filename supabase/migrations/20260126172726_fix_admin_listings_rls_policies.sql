/*
  # Fix Admin Listings RLS Policies

  ## Problem
  Current RLS policies allow ALL authenticated users to see ALL listings
  
  ## Changes
  1. Fix listings SELECT policy for authenticated users
  2. Fix hotels SELECT policy for authenticated users
  3. Fix guesthouses SELECT policy for authenticated users
  4. Ensure admins can see everything via service_role in API routes
  
  ## Security
  - Service role bypasses RLS (used by API routes)
  - Admins see all via app_metadata.role check
  - Hosts see own + approved
  - Guests see approved only
*/

-- Drop broken policies
DROP POLICY IF EXISTS "Authenticated can view listings" ON listings;
DROP POLICY IF EXISTS "Users can view hotels" ON hotels;
DROP POLICY IF EXISTS "Users can view guesthouses" ON guesthouses;

-- Fix listings SELECT for authenticated users
CREATE POLICY "Authenticated can view listings"
  ON listings
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR approval_status = 'approved'
    OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- Fix hotels SELECT for authenticated users
CREATE POLICY "Users can view hotels"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = hotels.listing_id
        AND (
          l.approval_status = 'approved'
          OR l.host_id = (SELECT auth.uid())
          OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
        )
    )
  );

-- Fix guesthouses SELECT for authenticated users
CREATE POLICY "Users can view guesthouses"
  ON guesthouses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = guesthouses.listing_id
        AND (
          l.approval_status = 'approved'
          OR l.host_id = (SELECT auth.uid())
          OR ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
        )
    )
  );
