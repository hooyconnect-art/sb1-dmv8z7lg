/*
  # Fix Authentication and Profile Synchronization

  ## Critical Fixes
  1. Update handle_new_user_profile to sync role to auth.users.raw_app_meta_data
  2. Create function to sync existing users' roles to JWT
  3. Update trigger to maintain JWT sync on profile updates

  ## Problem Solved
  - Guest signup creates profile but JWT doesn't have role
  - RLS policies using auth.jwt()->>'role' fail
  - Routing logic fails because role not in JWT
  - User management can't see proper roles

  ## Solution
  - Store role in BOTH profiles table AND auth.users.raw_app_meta_data
  - JWT will include role from app_metadata
  - All auth checks will work correctly
*/

-- =====================================================
-- STEP 1: Enhanced handle_new_user_profile function
-- Sync role to both profiles and auth.users app_metadata
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
  user_full_name text;
BEGIN
  -- Get role from app_metadata (admin-created) or user_metadata (self-signup) or default to guest
  user_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    NEW.raw_user_meta_data->>'role',
    'guest'
  );

  -- Get full name from user_metadata or default
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    'New User'
  );

  -- Insert/update profile
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
    user_full_name,
    NEW.raw_user_meta_data->>'phone',
    user_role,
    'active',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = now();

  -- Sync role to auth.users.raw_app_meta_data for JWT
  IF NEW.raw_app_meta_data IS NULL OR NEW.raw_app_meta_data->>'role' IS NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 2: Function to sync profile role to auth JWT
-- Call this after updating a user's role
-- =====================================================

CREATE OR REPLACE FUNCTION sync_user_role_to_jwt(user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update auth.users.raw_app_meta_data
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', new_role)
  WHERE id = user_id;

  -- Update profiles table
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = user_id;
END;
$$;

-- =====================================================
-- STEP 3: Sync all existing HoyConnect users
-- =====================================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id, email, role
    FROM profiles
    WHERE email NOT LIKE '%@mogadishu.so'
      AND email NOT LIKE 'test_trigger_%'
      AND status != 'deleted'
      AND role IS NOT NULL
  LOOP
    -- Sync role to JWT
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Synced role for user: % (role: %)', user_record.email, user_record.role;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: Create trigger for profile role changes
-- Automatically sync when role is updated in profiles
-- =====================================================

CREATE OR REPLACE FUNCTION sync_profile_role_to_jwt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If role changed, sync to JWT
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;

CREATE TRIGGER on_profile_role_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role IS DISTINCT FROM OLD.role)
  EXECUTE FUNCTION sync_profile_role_to_jwt();
