/*
  # Fix All Remaining Auth Re-evaluation Issues

  ## Problem
  Auth functions are still being re-evaluated per row in nested subqueries.
  The issue is using `(SELECT auth.uid() AS uid)` instead of just `(SELECT auth.uid())`
  
  ## Solution
  Replace ALL auth function calls with properly optimized SELECT wrappers:
  - Remove `AS uid` aliases that prevent optimization
  - Ensure auth functions are called once per query, not per row
  
  ## Tables Fixed
  - bookings (3 policies)
  - payments (4 policies) 
  - property_sales (3 policies)
  - sales_inquiries (1 policy)
  - commission_settings (3 policies)
  
  Total: 14 policies optimized
*/

-- =====================================================
-- BOOKINGS: Fix all auth re-evaluations
-- =====================================================

DROP POLICY IF EXISTS "Bookings insert policy" ON bookings;
DROP POLICY IF EXISTS "Bookings select policy" ON bookings;
DROP POLICY IF EXISTS "Bookings update policy" ON bookings;

CREATE POLICY "Bookings insert policy" ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    guest_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Bookings select policy" ON bookings
  FOR SELECT
  TO authenticated
  USING (
    guest_id = (SELECT auth.uid())
    OR listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Bookings update policy" ON bookings
  FOR UPDATE
  TO authenticated
  USING (
    listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    listing_id IN (
      SELECT id FROM listings WHERE host_id = (SELECT auth.uid())
    )
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PAYMENTS: Fix all auth re-evaluations
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
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments insert policy" ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments update policy" ON payments
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Payments delete policy" ON payments
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PROPERTY_SALES: Fix all auth re-evaluations
-- =====================================================

DROP POLICY IF EXISTS "Property sales insert policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales select policy" ON property_sales;
DROP POLICY IF EXISTS "Property sales update policy" ON property_sales;

CREATE POLICY "Property sales insert policy" ON property_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Property sales select policy" ON property_sales
  FOR SELECT
  TO authenticated
  USING (
    status = 'available'
    OR seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Property sales update policy" ON property_sales
  FOR UPDATE
  TO authenticated
  USING (
    seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    seller_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- SALES_INQUIRIES: Fix auth re-evaluation
-- =====================================================

DROP POLICY IF EXISTS "Sales inquiries select policy" ON sales_inquiries;

CREATE POLICY "Sales inquiries select policy" ON sales_inquiries
  FOR SELECT
  TO authenticated
  USING (
    property_sale_id IN (
      SELECT id FROM property_sales WHERE seller_id = (SELECT auth.uid())
    )
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- COMMISSION_SETTINGS: Fix all auth re-evaluations
-- =====================================================

DROP POLICY IF EXISTS "Commission settings insert policy" ON commission_settings;
DROP POLICY IF EXISTS "Commission settings update policy" ON commission_settings;
DROP POLICY IF EXISTS "Commission settings delete policy" ON commission_settings;

CREATE POLICY "Commission settings insert policy" ON commission_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Commission settings update policy" ON commission_settings
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

CREATE POLICY "Commission settings delete policy" ON commission_settings
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- VERIFICATION
-- =====================================================

COMMENT ON TABLE bookings IS 'RLS optimized: All auth functions wrapped with SELECT, no AS aliases';
COMMENT ON TABLE payments IS 'RLS optimized: All auth functions wrapped with SELECT, no AS aliases';
COMMENT ON TABLE property_sales IS 'RLS optimized: All auth functions wrapped with SELECT, no AS aliases';
COMMENT ON TABLE sales_inquiries IS 'RLS optimized: All auth functions wrapped with SELECT, no AS aliases';
COMMENT ON TABLE commission_settings IS 'RLS optimized: All auth functions wrapped with SELECT, no AS aliases';
