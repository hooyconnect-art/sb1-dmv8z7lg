/*
  # Fix Security and Performance Issues - Final
  
  This migration addresses all Supabase security recommendations:
  1. Missing indexes on foreign key columns
  2. RLS policy optimization (auth.uid() performance)
  3. RLS policies that are too permissive
  
  ## Changes Made
  
  ### 1. Add Missing Foreign Key Indexes
    - All foreign key columns now have covering indexes for optimal performance
  
  ### 2. Optimize RLS Policies
    - Replace `auth.uid()` with `(select auth.uid())` throughout
    - This prevents re-evaluation for each row, improving performance at scale
  
  ### 3. Restrict Overly Permissive Policies
    - audit_logs: Restrict to proper user validation
    - sales_inquiries: Add buyer_id validation for inserts
*/

-- ============================================
-- ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property ON bookings(property_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_host ON properties(host_id);

-- Property sales indexes
CREATE INDEX IF NOT EXISTS idx_property_sales_area ON property_sales(area_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_city ON property_sales(city_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_guest ON reviews(guest_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);

-- Commission settings indexes
CREATE INDEX IF NOT EXISTS idx_commission_settings_updated_by ON commission_settings(updated_by);

-- Featured listings indexes
CREATE INDEX IF NOT EXISTS idx_featured_listings_created_by ON featured_listings(created_by);
CREATE INDEX IF NOT EXISTS idx_featured_listings_listing ON featured_listings(listing_id);
CREATE INDEX IF NOT EXISTS idx_featured_listings_property_sale ON featured_listings(property_sale_id);

-- Website content indexes
CREATE INDEX IF NOT EXISTS idx_website_content_updated_by ON website_content(updated_by);

-- ============================================
-- OPTIMIZE RLS POLICIES - PROFILES
-- ============================================

DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- OPTIMIZE RLS POLICIES - BOOKINGS
-- ============================================

DROP POLICY IF EXISTS "Users can view bookings" ON bookings;
CREATE POLICY "Users can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = guest_id OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update bookings" ON bookings;
CREATE POLICY "Users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = guest_id)
  WITH CHECK ((select auth.uid()) = guest_id);

-- ============================================
-- OPTIMIZE RLS POLICIES - HOST REQUESTS
-- ============================================

DROP POLICY IF EXISTS "Users can view host requests" ON host_requests;
CREATE POLICY "Users can view host requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- ============================================
-- OPTIMIZE RLS POLICIES - LISTINGS
-- ============================================

DROP POLICY IF EXISTS "Users can view listings" ON listings;
CREATE POLICY "Users can view listings"
  ON listings FOR SELECT
  TO authenticated
  USING (
    status = 'approved' OR
    host_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can update listings" ON listings;
CREATE POLICY "Users can update listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (host_id = (select auth.uid()))
  WITH CHECK (host_id = (select auth.uid()));

-- ============================================
-- OPTIMIZE RLS POLICIES - HOTELS
-- ============================================

DROP POLICY IF EXISTS "Users can view hotels" ON hotels;
CREATE POLICY "Users can view hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings 
      WHERE status = 'approved' OR host_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - ROOMS
-- ============================================

DROP POLICY IF EXISTS "Users can view rooms" ON rooms;
CREATE POLICY "Users can view rooms"
  ON rooms FOR SELECT
  TO authenticated
  USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN listings l ON h.listing_id = l.id
      WHERE l.status = 'approved' OR l.host_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - GUESTHOUSES
-- ============================================

DROP POLICY IF EXISTS "Users can view guesthouses" ON guesthouses;
CREATE POLICY "Users can view guesthouses"
  ON guesthouses FOR SELECT
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings 
      WHERE status = 'approved' OR host_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - WAITING LIST
-- ============================================

DROP POLICY IF EXISTS "Users can view waiting list" ON waiting_list;
CREATE POLICY "Users can view waiting list"
  ON waiting_list FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = guest_id);

DROP POLICY IF EXISTS "Users can update waiting list" ON waiting_list;
CREATE POLICY "Users can update waiting list"
  ON waiting_list FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = guest_id)
  WITH CHECK ((select auth.uid()) = guest_id);

-- ============================================
-- OPTIMIZE RLS POLICIES - LOCATIONS
-- ============================================

DROP POLICY IF EXISTS "Super admin and admin can manage countries" ON countries;
CREATE POLICY "Super admin and admin can manage countries"
  ON countries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage cities" ON cities;
CREATE POLICY "Super admin and admin can manage cities"
  ON cities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage areas" ON areas;
CREATE POLICY "Super admin and admin can manage areas"
  ON areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - PROPERTY SALES
-- ============================================

DROP POLICY IF EXISTS "Hosts can manage own property sales" ON property_sales;
CREATE POLICY "Hosts can manage own property sales"
  ON property_sales FOR ALL
  TO authenticated
  USING ((select auth.uid()) = host_id);

DROP POLICY IF EXISTS "Super admin and admin can manage all property sales" ON property_sales;
CREATE POLICY "Super admin and admin can manage all property sales"
  ON property_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - SALES INQUIRIES
-- ============================================

DROP POLICY IF EXISTS "Buyers can view own inquiries" ON sales_inquiries;
CREATE POLICY "Buyers can view own inquiries"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = buyer_id);

DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON sales_inquiries;
CREATE POLICY "Property owners can view inquiries for their properties"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE property_sales.id = sales_inquiries.property_sale_id
      AND property_sales.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Property owners can update inquiries for their properties" ON sales_inquiries;
CREATE POLICY "Property owners can update inquiries for their properties"
  ON sales_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE property_sales.id = sales_inquiries.property_sale_id
      AND property_sales.host_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage all inquiries" ON sales_inquiries;
CREATE POLICY "Super admin and admin can manage all inquiries"
  ON sales_inquiries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Fix overly permissive inquiry creation policy
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON sales_inquiries;
CREATE POLICY "Authenticated users can create inquiries"
  ON sales_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - CONFIGURATION
-- ============================================

DROP POLICY IF EXISTS "Super admin and admin can manage property types" ON property_types;
CREATE POLICY "Super admin and admin can manage property types"
  ON property_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage amenities" ON amenities;
CREATE POLICY "Super admin and admin can manage amenities"
  ON amenities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage payment methods" ON payment_methods;
CREATE POLICY "Super admin and admin can manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage commission settings" ON commission_settings;
CREATE POLICY "Super admin and admin can manage commission settings"
  ON commission_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - CONTENT
-- ============================================

DROP POLICY IF EXISTS "Super admin and admin can manage website content" ON website_content;
CREATE POLICY "Super admin and admin can manage website content"
  ON website_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "Super admin and admin can manage featured listings" ON featured_listings;
CREATE POLICY "Super admin and admin can manage featured listings"
  ON featured_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- OPTIMIZE RLS POLICIES - AUDIT LOGS
-- ============================================

DROP POLICY IF EXISTS "Super admin and admin can view all audit logs" ON audit_logs;
CREATE POLICY "Super admin and admin can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Fix overly permissive audit log creation - only allow own user_id
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );
