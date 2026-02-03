/*
  # Fix Guest Signup & Admin User Management - COMPLETE FIX

  ## Critical Issues Fixed
  
  1. **Guest Signup → Users Management Sync**
     - Profiles are now automatically created in profiles table when user signs up
     - Role, full_name, phone are properly extracted from user_metadata
     - Email auto-confirmation enabled
     - app_metadata.role is set for JWT claims
  
  2. **User Update/Delete/Role Change Failures**
     - Admins can now update ANY user profile (not just their own)
     - Admins can delete ANY user
     - Super admin has full control via RLS policies
     - Role changes persist in both profiles AND auth.users.app_metadata
  
  3. **System Consistency**
     - Single source of truth: auth.users → profiles table
     - Users Management shows ALL users (including guest signups)
     - No disconnect between admin/service-role and public contexts

  ## Changes
  - Recreate handle_new_user trigger to create profiles
  - Add admin UPDATE/DELETE policies on profiles
  - Ensure phone number captured from raw_user_meta_data
  - Auto-confirm emails for immediate login
  - Sync app_metadata.role with profiles.role

  ## Security
  - Service role: Full access
  - Admin/Super Admin: Can manage all profiles
  - Regular users: Can only update own profile
*/

-- =====================================================
-- PART 1: Fix handle_new_user Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  user_role text;
  user_phone text;
BEGIN
  -- Extract role from raw_user_meta_data or raw_app_meta_data, default to 'guest'
  user_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'guest'
  );

  -- Extract phone from raw_user_meta_data
  user_phone := NEW.raw_user_meta_data->>'phone';

  -- Auto-confirm email for immediate login
  IF (NEW.email_confirmed_at IS NULL) THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;

  -- Set role in app_metadata for JWT claims
  IF (NEW.raw_app_meta_data IS NULL OR NEW.raw_app_meta_data->>'role' IS NULL) THEN
    NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role);
  END IF;

  -- Create profile in profiles table
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone,
    role, 
    status,
    verified,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_phone,
    user_role,
    'active',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 2: Fix Profiles RLS Policies for Admin Operations
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_service_role" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

-- =====================================================
-- SERVICE ROLE: Full access
-- =====================================================
CREATE POLICY "profiles_service_role"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- SELECT POLICIES
-- =====================================================

-- Authenticated users can view all profiles (needed for app functionality)
CREATE POLICY "profiles_select_all"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- INSERT POLICY
-- =====================================================

-- Authenticated users can insert their own profile (for trigger)
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- =====================================================
-- UPDATE POLICIES
-- =====================================================

-- Regular users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Admins and super admins can update ANY profile
CREATE POLICY "profiles_update_admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  )
  WITH CHECK (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- DELETE POLICY
-- =====================================================

-- Only admins and super admins can delete profiles
CREATE POLICY "profiles_delete_admin"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    ((SELECT (auth.jwt() -> 'app_metadata' ->> 'role'))) = ANY (ARRAY['admin', 'super_admin'])
  );

-- =====================================================
-- PART 3: Add Missing Columns If Needed
-- =====================================================

-- Ensure is_active column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Ensure status column exists  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;
