/*
  # Fix Infinite Recursion in Profiles RLS Policies

  ## Problem
  The "Super admins can view all profiles" policy creates infinite recursion
  because it queries the profiles table to check if a user is a super_admin,
  but reading profiles requires checking this same policy.

  ## Solution
  Remove the recursive policy. The "Users can view all profiles" policy
  already allows all authenticated users to view profiles, which is sufficient.
  Super admins can still perform all operations through the separate management
  policy that uses WITH CHECK.

  ## Changes
  1. Drop the problematic "Super admins can view all profiles" SELECT policy
  2. Drop the duplicate "Super admins can update all profiles" UPDATE policy
  3. Keep "Users can view all profiles" (qual=true) for SELECT access
  4. Keep "Super admin can manage all profiles" for full management access
*/

-- Remove the recursive SELECT policy for super admins
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Remove the duplicate UPDATE policy (covered by the ALL policy below)
DROP POLICY IF EXISTS "Super admins can update all profiles" ON profiles;

-- The "Users can view all profiles" policy (qual=true) already allows
-- all authenticated users to read profiles without recursion

-- The "Super admin can manage all profiles" FOR ALL policy is kept
-- but should NOT be used for SELECT operations to avoid recursion
DROP POLICY IF EXISTS "Super admin can manage all profiles" ON profiles;

-- Recreate the super admin management policy for INSERT, UPDATE, DELETE only
-- Super admins will use the "Users can view all profiles" policy for SELECT
CREATE POLICY "Super admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );

CREATE POLICY "Super admin can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'super_admin'
    )
  );
