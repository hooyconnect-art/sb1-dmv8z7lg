/*
  # Fix Admin Listings & Users Visibility

  ## Problem
  - Admin cannot see listings created by hosts (RLS blocking)
  - RLS policies have infinite recursion (profiles checking profiles)
  - Queries fail with "Failed to fetch listings" error

  ## Solution
  1. Drop old recursive RLS policies on listings
  2. Create new simplified policies using auth.jwt() to avoid recursion
  3. Allow admin/super_admin to view ALL listings without filters
  4. Maintain security for guests and hosts

  ## Changes
  - Listings table: New SELECT policy for admin access
  - Use JWT role directly instead of querying profiles table
  - No more recursive dependencies

  ## Security
  - Guests: Only see approved listings
  - Hosts: See own listings + approved listings
  - Admin/Super Admin: See ALL listings (pending, approved, rejected)
*/

-- Drop existing problematic policies on listings
DROP POLICY IF EXISTS "Users can view listings" ON listings;
DROP POLICY IF EXISTS "Hosts can view listings" ON listings;
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;

-- Create new simplified SELECT policies for listings
-- Policy 1: Admins can view ALL listings
CREATE POLICY "Admin can view all listings"
ON listings
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

-- Policy 2: Hosts can view their own listings
CREATE POLICY "Host can view own listings"
ON listings
FOR SELECT
TO authenticated
USING (
  host_id = auth.uid() 
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'host'
);

-- Policy 3: All authenticated users can view approved listings
CREATE POLICY "Anyone can view approved listings"
ON listings
FOR SELECT
TO authenticated
USING (
  is_active = true 
  AND approval_status = 'approved'
);

-- Drop old recursive UPDATE policies and recreate them
DROP POLICY IF EXISTS "Super admins can update all listings" ON listings;
DROP POLICY IF EXISTS "Users can update listings" ON listings;

CREATE POLICY "Admin can update all listings"
ON listings
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

CREATE POLICY "Host can update own listings"
ON listings
FOR UPDATE
TO authenticated
USING (
  host_id = auth.uid()
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'host'
)
WITH CHECK (
  host_id = auth.uid()
  AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'host'
);

-- Fix profiles table policies (remove recursion)
DROP POLICY IF EXISTS "Super admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admin can delete profiles" ON profiles;

CREATE POLICY "Admin can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

CREATE POLICY "Admin can insert profiles"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);

CREATE POLICY "Admin can delete profiles"
ON profiles
FOR DELETE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
);
