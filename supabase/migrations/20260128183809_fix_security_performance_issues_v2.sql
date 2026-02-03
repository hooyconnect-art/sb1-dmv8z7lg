/*
  # Comprehensive Security and Performance Fixes

  ## Overview
  Fixes all reported security and performance issues from Supabase advisor

  ## Changes

  ### 1. Add Missing Indexes for Foreign Keys
  Creates indexes on all foreign key columns to improve query performance

  ### 2. Optimize Auth RLS Policies
  Wraps all auth.uid() and auth.jwt() calls with SELECT to prevent per-row re-evaluation

  ### 3. Remove Unused Indexes
  Drops indexes that have not been used to reduce storage and write overhead

  ### 4. Consolidate Duplicate Policies
  Merges multiple permissive policies into single optimized policies

  ### 5. Fix Function Search Path
  Sets immutable search_path for functions to prevent security issues
*/

-- =====================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- =====================================================

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id);

-- bookings
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id 
  ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id 
  ON bookings(room_id);

-- collection_schedules
CREATE INDEX IF NOT EXISTS idx_collection_schedules_driver_id 
  ON collection_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_vehicle_id 
  ON collection_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_zone_id 
  ON collection_schedules(zone_id);

-- collections
CREATE INDEX IF NOT EXISTS idx_collections_driver_id 
  ON collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_collections_schedule_id 
  ON collections(schedule_id);

-- complaints
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to 
  ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id 
  ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_zone_id 
  ON complaints(zone_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_booking_id 
  ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id 
  ON payments(business_id);

-- sales_inquiries
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_property_sale_id 
  ON sales_inquiries(property_sale_id);

-- waste_bins
CREATE INDEX IF NOT EXISTS idx_waste_bins_zone_id 
  ON waste_bins(zone_id);

-- zones
CREATE INDEX IF NOT EXISTS idx_zones_district_id 
  ON zones(district_id);

-- =====================================================
-- 2. DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_booking_payments_guest_id;
DROP INDEX IF EXISTS idx_booking_payments_host_id;
DROP INDEX IF EXISTS idx_booking_payments_status;
DROP INDEX IF EXISTS idx_booking_payments_created_at;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_transactions_type;
DROP INDEX IF EXISTS idx_transactions_reference;
DROP INDEX IF EXISTS idx_transactions_created_at;
DROP INDEX IF EXISTS idx_host_payment_settings_host_id;

-- =====================================================
-- 3. FIX AUTH RLS POLICIES - LISTINGS
-- =====================================================

DROP POLICY IF EXISTS "listings_select_optimized" ON listings;
CREATE POLICY "listings_select_optimized"
  ON listings
  FOR SELECT
  TO authenticated
  USING (
    is_available = true 
    AND status = 'approved'
    OR host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- =====================================================
-- 4. FIX AUTH RLS POLICIES - HOTELS
-- =====================================================

DROP POLICY IF EXISTS "hotels_select_optimized" ON hotels;
CREATE POLICY "hotels_select_optimized"
  ON hotels
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = hotels.listing_id
      AND (
        (listings.status = 'approved' AND listings.is_available = true)
        OR listings.host_id = (SELECT auth.uid())
        OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
      )
    )
  );

-- =====================================================
-- 5. FIX AUTH RLS POLICIES - ROOMS
-- =====================================================

DROP POLICY IF EXISTS "rooms_select_optimized" ON rooms;
CREATE POLICY "rooms_select_optimized"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hotels
      JOIN listings ON listings.id = hotels.listing_id
      WHERE hotels.id = rooms.hotel_id
      AND (
        (listings.status = 'approved' AND listings.is_available = true)
        OR listings.host_id = (SELECT auth.uid())
        OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
      )
    )
  );

-- =====================================================
-- 6. FIX AUTH RLS POLICIES - GUESTHOUSES
-- =====================================================

DROP POLICY IF EXISTS "guesthouses_select_optimized" ON guesthouses;
CREATE POLICY "guesthouses_select_optimized"
  ON guesthouses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = guesthouses.listing_id
      AND (
        (listings.status = 'approved' AND listings.is_available = true)
        OR listings.host_id = (SELECT auth.uid())
        OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
      )
    )
  );

-- =====================================================
-- 7. FIX AUTH RLS POLICIES - HOST_PAYMENT_SETTINGS
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Hosts can view own payment settings" ON host_payment_settings;
DROP POLICY IF EXISTS "Hosts can create own payment settings" ON host_payment_settings;
DROP POLICY IF EXISTS "Hosts can update own payment settings" ON host_payment_settings;
DROP POLICY IF EXISTS "Super admins can view all payment settings" ON host_payment_settings;
DROP POLICY IF EXISTS "Super admins can update verification status" ON host_payment_settings;

-- Consolidated SELECT policy
CREATE POLICY "host_payment_settings_select_optimized"
  ON host_payment_settings
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- Consolidated INSERT policy
CREATE POLICY "host_payment_settings_insert_optimized"
  ON host_payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    host_id = (SELECT auth.uid())
    AND (SELECT (auth.jwt()->>'role')) = 'host'
  );

-- Consolidated UPDATE policy
CREATE POLICY "host_payment_settings_update_optimized"
  ON host_payment_settings
  FOR UPDATE
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  )
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- =====================================================
-- 8. CONSOLIDATE BOOKING_PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "booking_payments_all_super_admin" ON booking_payments;
DROP POLICY IF EXISTS "booking_payments_select_optimized" ON booking_payments;

CREATE POLICY "booking_payments_select_consolidated"
  ON booking_payments
  FOR SELECT
  TO authenticated
  USING (
    guest_id = (SELECT auth.uid())
    OR host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- =====================================================
-- 9. CONSOLIDATE COMMISSION_SETTINGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Commission settings select policy" ON commission_settings;
DROP POLICY IF EXISTS "commission_settings_all_optimized" ON commission_settings;

CREATE POLICY "commission_settings_select_consolidated"
  ON commission_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 10. CONSOLIDATE HOST_WALLETS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "host_wallets_all_super_admin" ON host_wallets;
DROP POLICY IF EXISTS "host_wallets_select_optimized" ON host_wallets;

CREATE POLICY "host_wallets_select_consolidated"
  ON host_wallets
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- =====================================================
-- 11. CONSOLIDATE TRANSACTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "transactions_all_super_admin" ON transactions;
DROP POLICY IF EXISTS "transactions_select_optimized" ON transactions;

CREATE POLICY "transactions_select_consolidated"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- =====================================================
-- 12. FIX FUNCTION SEARCH PATH
-- =====================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS update_host_payment_settings_updated_at_trigger ON host_payment_settings;

-- Recreate function with proper search_path
CREATE OR REPLACE FUNCTION update_host_payment_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_host_payment_settings_updated_at_trigger
  BEFORE UPDATE ON host_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_host_payment_settings_updated_at();
