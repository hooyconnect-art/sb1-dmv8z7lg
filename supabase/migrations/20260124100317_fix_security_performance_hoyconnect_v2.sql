/*
  # Fix Security and Performance Issues - HoyConnect Only V2

  1. Add Missing Indexes
    - Foreign keys on bookings, payments, property_sales, rooms, sales_inquiries
  
  2. Optimize RLS Policies
    - Replace auth.uid() with (select auth.uid()) for better performance
    - Update commission_settings, bookings, payments, property_sales, sales_inquiries policies
  
  3. Drop Unused Indexes
    - idx_bookings_room_id (not used)
    - idx_payments_business_id (not used)
  
  4. Fix Function Search Path
    - Set search_path for update_commission_settings_updated_at
  
  NOTE: Does NOT touch waste management tables
*/

-- ============================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_seller_id ON property_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_property_sale_id ON sales_inquiries(property_sale_id);

-- ============================================
-- 2. DROP UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_bookings_room_id;
DROP INDEX IF EXISTS idx_payments_business_id;

-- ============================================
-- 3. FIX FUNCTION SEARCH PATH
-- ============================================

CREATE OR REPLACE FUNCTION update_commission_settings_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================
-- 4. OPTIMIZE COMMISSION SETTINGS RLS
-- ============================================

DROP POLICY IF EXISTS "Super admins can modify commission settings" ON commission_settings;
DROP POLICY IF EXISTS "Anyone can read commission settings" ON commission_settings;

CREATE POLICY "Anyone can read commission settings"
  ON commission_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can modify commission settings"
  ON commission_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'super_admin'
    )
  );

-- ============================================
-- 5. OPTIMIZE BOOKINGS RLS
-- ============================================

DROP POLICY IF EXISTS "Guests can create bookings" ON bookings;
DROP POLICY IF EXISTS "Guests can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Guests can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

CREATE POLICY "Guests can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (guest_id = (select auth.uid()));

CREATE POLICY "Guests can view own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (guest_id = (select auth.uid()));

CREATE POLICY "Guests can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (guest_id = (select auth.uid()))
  WITH CHECK (guest_id = (select auth.uid()));

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 6. OPTIMIZE PAYMENTS RLS
-- ============================================

DROP POLICY IF EXISTS "Users can view own booking payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

CREATE POLICY "Users can view own booking payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.guest_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage all payments"
  ON payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 7. OPTIMIZE PROPERTY SALES RLS
-- ============================================

DROP POLICY IF EXISTS "Sellers can create property sales" ON property_sales;
DROP POLICY IF EXISTS "Sellers can view own properties" ON property_sales;
DROP POLICY IF EXISTS "Sellers can update own properties" ON property_sales;
DROP POLICY IF EXISTS "Admins can manage all property sales" ON property_sales;
DROP POLICY IF EXISTS "Anyone can view active property sales" ON property_sales;

CREATE POLICY "Sellers can create property sales"
  ON property_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = (select auth.uid()));

CREATE POLICY "Sellers can view own properties"
  ON property_sales
  FOR SELECT
  TO authenticated
  USING (seller_id = (select auth.uid()));

CREATE POLICY "Sellers can update own properties"
  ON property_sales
  FOR UPDATE
  TO authenticated
  USING (seller_id = (select auth.uid()))
  WITH CHECK (seller_id = (select auth.uid()));

CREATE POLICY "Anyone can view active property sales"
  ON property_sales
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all property sales"
  ON property_sales
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- ============================================
-- 8. OPTIMIZE SALES INQUIRIES RLS
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON sales_inquiries;
DROP POLICY IF EXISTS "Property sellers can view inquiries" ON sales_inquiries;
DROP POLICY IF EXISTS "Admins can manage inquiries" ON sales_inquiries;

CREATE POLICY "Authenticated users can create inquiries"
  ON sales_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Property sellers can view inquiries"
  ON sales_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE property_sales.id = sales_inquiries.property_sale_id
      AND property_sales.seller_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage inquiries"
  ON sales_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('super_admin', 'admin')
    )
  );
