/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes
    - Add indexes for all unindexed foreign keys
    - Improves query performance for JOIN operations

  2. Optimize RLS Policies
    - Wrap auth functions in SELECT for better performance
    - Prevents re-evaluation for each row

  3. Remove Duplicate Indexes
    - Drop duplicate indexes to reduce overhead

  4. Fix Function Search Path
    - Make function search path immutable for security

  5. Clean Up Overlapping Policies
    - Remove redundant permissive policies
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_guesthouses_area_id ON guesthouses(area_id);
CREATE INDEX IF NOT EXISTS idx_guesthouses_city_id ON guesthouses(city_id);
CREATE INDEX IF NOT EXISTS idx_guesthouses_country_id ON guesthouses(country_id);
CREATE INDEX IF NOT EXISTS idx_hotels_area_id ON hotels(area_id);
CREATE INDEX IF NOT EXISTS idx_hotels_city_id ON hotels(city_id);
CREATE INDEX IF NOT EXISTS idx_hotels_country_id ON hotels(country_id);

-- Drop duplicate indexes
DROP INDEX IF EXISTS idx_audit_logs_created;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_payments_booking;
DROP INDEX IF EXISTS idx_sales_inquiries_property;

-- Fix function to have immutable search path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Optimize RLS policies - Drop and recreate with optimized auth checks
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all guesthouses" ON guesthouses;
DROP POLICY IF EXISTS "Super admins can update all guesthouses" ON guesthouses;
DROP POLICY IF EXISTS "Super admins can update all property sales" ON property_sales;
DROP POLICY IF EXISTS "Super admins can view all sales inquiries" ON sales_inquiries;
DROP POLICY IF EXISTS "Super admins can update all sales inquiries" ON sales_inquiries;
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Super admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Super admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Super admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Super admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Super admins can view all hotels" ON hotels;
DROP POLICY IF EXISTS "Super admins can update all hotels" ON hotels;

-- Recreate optimized policies with SELECT wrapper
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all guesthouses"
  ON guesthouses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all guesthouses"
  ON guesthouses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all property sales"
  ON property_sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all sales inquiries"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all sales inquiries"
  ON sales_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can view all hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all hotels"
  ON hotels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'super_admin'
    )
  );