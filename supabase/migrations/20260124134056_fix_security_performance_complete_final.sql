/*
  # Fix All Security and Performance Issues
  
  Comprehensive fix for all Supabase security warnings:
  - 17 unindexed foreign keys
  - 9 RLS policies with auth.uid() re-evaluation
  - 2 duplicate permissive policies
  - 1 function with mutable search_path
  - Additional performance optimizations
*/

-- =====================================================
-- PART 1: FOREIGN KEY INDEXES (17 total)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_property_sale_id ON sales_inquiries(property_sale_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_driver_id ON collection_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_vehicle_id ON collection_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_collection_schedules_zone_id ON collection_schedules(zone_id);
CREATE INDEX IF NOT EXISTS idx_collections_driver_id ON collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_collections_schedule_id ON collections(schedule_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_zone_id ON complaints(zone_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_bins_zone_id ON waste_bins(zone_id);
CREATE INDEX IF NOT EXISTS idx_zones_district_id ON zones(district_id);

-- =====================================================
-- PART 2: OPTIMIZE PAYMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Payments manage policy" ON payments;
DROP POLICY IF EXISTS "Payments select policy" ON payments;

CREATE POLICY "Payments view policy" ON payments FOR SELECT TO authenticated
USING (
  booking_id IN (SELECT id FROM bookings WHERE guest_id = (SELECT auth.uid()))
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

CREATE POLICY "Payments admin manage policy" ON payments FOR ALL TO authenticated
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin']))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin']));

-- =====================================================
-- PART 3: OPTIMIZE BOOKINGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Bookings insert policy" ON bookings;
DROP POLICY IF EXISTS "Bookings select policy" ON bookings;
DROP POLICY IF EXISTS "Bookings update policy" ON bookings;

CREATE POLICY "Bookings insert policy" ON bookings FOR INSERT TO authenticated
WITH CHECK (
  guest_id = (SELECT auth.uid())
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

CREATE POLICY "Bookings select policy" ON bookings FOR SELECT TO authenticated
USING (
  guest_id = (SELECT auth.uid())
  OR listing_id IN (SELECT id FROM listings WHERE host_id = (SELECT auth.uid()))
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

CREATE POLICY "Bookings update policy" ON bookings FOR UPDATE TO authenticated
USING (
  listing_id IN (SELECT id FROM listings WHERE host_id = (SELECT auth.uid()))
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
)
WITH CHECK (
  listing_id IN (SELECT id FROM listings WHERE host_id = (SELECT auth.uid()))
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

-- =====================================================
-- PART 4: OPTIMIZE PROPERTY_SALES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Property sales insert policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales select policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales update policy" ON property_sales;

CREATE POLICY "Property sales insert policy" ON property_sales FOR INSERT TO authenticated
WITH CHECK (
  seller_id = (SELECT auth.uid())
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

CREATE POLICY "Property sales select policy" ON property_sales FOR SELECT TO authenticated
USING (
  status = 'available'
  OR seller_id = (SELECT auth.uid())
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

CREATE POLICY "Property sales update policy" ON property_sales FOR UPDATE TO authenticated
USING (
  seller_id = (SELECT auth.uid())
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
)
WITH CHECK (
  seller_id = (SELECT auth.uid())
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

-- =====================================================
-- PART 5: OPTIMIZE SALES_INQUIRIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Sales inquiries insert policy" ON sales_inquiries;
DROP POLICY IF EXISTS "Sales inquiries select policy" ON sales_inquiries;

CREATE POLICY "Sales inquiries insert policy" ON sales_inquiries FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Sales inquiries select policy" ON sales_inquiries FOR SELECT TO authenticated
USING (
  property_sale_id IN (SELECT id FROM property_sales WHERE seller_id = (SELECT auth.uid()))
  OR (SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
);

-- =====================================================
-- PART 6: OPTIMIZE COMMISSION_SETTINGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Commission settings modify policy" ON commission_settings;
DROP POLICY IF EXISTS "Commission settings select policy" ON commission_settings;

CREATE POLICY "Commission settings view policy" ON commission_settings FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Commission settings manage policy" ON commission_settings FOR ALL TO authenticated
USING ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin']))
WITH CHECK ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin']));

-- =====================================================
-- PART 7: FIX COMMISSION FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS calculate_booking_commission(uuid);
DROP FUNCTION IF EXISTS calculate_booking_commission(text, numeric);

CREATE FUNCTION calculate_booking_commission(p_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_property_type TEXT;
  v_total_amount NUMERIC;
  v_commission_rate NUMERIC;
BEGIN
  SELECT b.property_type, b.total_price
  INTO v_property_type, v_total_amount
  FROM bookings b
  WHERE b.id = p_booking_id;

  IF v_property_type NOT IN ('hotel', 'fully_furnished') THEN
    RETURN 0.00;
  END IF;

  SELECT commission_rate INTO v_commission_rate
  FROM commission_settings
  WHERE property_type = CASE v_property_type
    WHEN 'hotel' THEN 'Hotel'
    WHEN 'fully_furnished' THEN 'Fully Furnished'
    ELSE 'Rental'
  END
  AND is_active = true;

  RETURN (v_total_amount * COALESCE(v_commission_rate, 0) / 100);
END;
$$;

CREATE FUNCTION calculate_booking_commission(p_property_type text, p_total_price numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_commission_rate numeric;
BEGIN
  SELECT commission_rate INTO v_commission_rate
  FROM commission_settings
  WHERE property_type = p_property_type
    AND is_active = true
  LIMIT 1;

  RETURN p_total_price * (COALESCE(v_commission_rate, 0) / 100);
END;
$$;

-- =====================================================
-- PART 8: PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_listings_status_active ON listings(approval_status, is_active, is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_property_sales_status ON property_sales(status);
CREATE INDEX IF NOT EXISTS idx_property_sales_seller_id ON property_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
