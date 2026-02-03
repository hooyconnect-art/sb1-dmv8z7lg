/*
  # Auto-confirm emails for new users - Version 3
  
  ## Overview
  Automatically confirms email addresses for new user signups.
  Uses AFTER trigger with UPDATE to set confirmation fields.
  
  ## Changes
  - Drop and recreate trigger as BEFORE trigger
  - Modify NEW record to auto-confirm email
  - Set role in app_metadata
  
  ## Security
  - Function runs with SECURITY DEFINER to access auth schema
  - Only affects new user signups
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate function for BEFORE trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE(NEW.raw_app_meta_data->>'role', 'guest');

  -- Auto-confirm email
  IF (NEW.email_confirmed_at IS NULL) THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;

  -- Set role in app_metadata
  IF (NEW.raw_app_meta_data IS NULL OR NEW.raw_app_meta_data->>'role' IS NULL) THEN
    NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role);
  END IF;

  RETURN NEW;
END;
$$;

-- Create BEFORE trigger
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create separate function for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role text;
BEGIN
  user_role := COALESCE(NEW.raw_app_meta_data->>'role', 'guest');

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    status,
    verified,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
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

  RETURN NEW;
END;
$$;

-- Create AFTER trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();
