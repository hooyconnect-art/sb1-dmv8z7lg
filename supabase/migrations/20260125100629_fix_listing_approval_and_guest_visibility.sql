/*
  # Fix Listing Approval and Guest Visibility

  ## Problems Fixed
  1. **Approve/Reject Failure**: RLS policies interfering with service_role updates
  2. **Guest Visibility**: Inconsistent column checks between anon and authenticated policies
  
  ## Changes
  1. Make all SELECT policies use `approval_status` consistently (not `status`)
  2. Simplify UPDATE policies to avoid complex EXISTS checks with profiles table
  3. Ensure service_role can update without restrictions
  4. Ensure anon users can see approved listings with consistent rules
  
  ## Security
  - Admins can update all listings
  - Hosts can update only their own listings
  - Public can view only approved + active listings
  - Service role bypasses all RLS
*/

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view listings" ON listings;
DROP POLICY IF EXISTS "Public can view approved listings" ON listings;
DROP POLICY IF EXISTS "Hosts can update own listings" ON listings;
DROP POLICY IF EXISTS "Hosts can create listings" ON listings;
DROP POLICY IF EXISTS "Admins can delete listings" ON listings;

-- =====================================================
-- SELECT POLICIES - Use approval_status consistently
-- =====================================================

-- Authenticated users can view:
-- 1. Their own listings (any status)
-- 2. Approved listings (public)
-- 3. All listings (if admin/super_admin)
CREATE POLICY "Authenticated can view listings"
  ON listings
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR approval_status = 'approved'
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- Anonymous users can ONLY view approved + active listings
CREATE POLICY "Public can view approved listings"
  ON listings
  FOR SELECT
  TO anon
  USING (
    approval_status = 'approved'
    AND is_active = true
  );

-- =====================================================
-- INSERT POLICY - Simplified
-- =====================================================

CREATE POLICY "Hosts and admins can create listings"
  ON listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    host_id = (SELECT auth.uid())
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- UPDATE POLICIES - Simplified without profiles lookup
-- =====================================================

-- Admins can update ALL listings
CREATE POLICY "Admins can update all listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );

-- Hosts can update ONLY their own listings
CREATE POLICY "Hosts can update own listings"
  ON listings
  FOR UPDATE
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    AND ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = 'host'
  )
  WITH CHECK (
    host_id = (SELECT auth.uid())
    AND ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = 'host'
  );

-- =====================================================
-- DELETE POLICY
-- =====================================================

CREATE POLICY "Admins can delete listings"
  ON listings
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT auth.jwt() -> 'app_metadata' ->> 'role')) = ANY (ARRAY['admin', 'super_admin'])
  );
