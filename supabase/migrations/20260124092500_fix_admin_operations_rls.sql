/*
  # Fix Admin Operations - Add Service Role Policies

  1. Changes
    - Add service_role policy to listings table to allow ALL operations
    - Add service_role policy to hotels table
    - Add service_role policy to guesthouses table
    - Add service_role policy to rooms table
    
  2. Security
    - Service role bypasses all RLS restrictions
    - Only server-side admin operations use service_role key
    - Client-side continues to use regular auth policies
*/

-- Add service role policy for listings (ALL operations)
DROP POLICY IF EXISTS "listings_service_role" ON listings;
CREATE POLICY "listings_service_role"
  ON listings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policy for hotels
DROP POLICY IF EXISTS "hotels_service_role" ON hotels;
CREATE POLICY "hotels_service_role"
  ON hotels
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policy for guesthouses
DROP POLICY IF EXISTS "guesthouses_service_role" ON guesthouses;
CREATE POLICY "guesthouses_service_role"
  ON guesthouses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policy for rooms
DROP POLICY IF EXISTS "rooms_service_role" ON rooms;
CREATE POLICY "rooms_service_role"
  ON rooms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policy for bookings
DROP POLICY IF EXISTS "bookings_service_role" ON bookings;
CREATE POLICY "bookings_service_role"
  ON bookings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add service role policy for payments
DROP POLICY IF EXISTS "payments_service_role" ON payments;
CREATE POLICY "payments_service_role"
  ON payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
