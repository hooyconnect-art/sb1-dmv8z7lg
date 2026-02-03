/*
  # Auto-confirm emails for new users - Fixed version
  
  ## Overview
  Automatically confirms email addresses for new user signups by modifying the NEW record.
  This avoids the issue of trying to UPDATE during an INSERT trigger.
  
  ## Changes
  - Modify NEW record directly to set confirmation timestamps
  - Create profile with active status
  
  ## Security
  - Function runs with SECURITY DEFINER to access auth schema
  - Only affects new user signups
*/

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

  -- Auto-confirm email by setting timestamps on NEW record
  IF (NEW.email_confirmed_at IS NULL) THEN
    NEW.email_confirmed_at := now();
    NEW.confirmed_at := now();
  END IF;

  -- Set role in app_metadata if not already set
  IF (NEW.raw_app_meta_data->>'role' IS NULL) THEN
    NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role);
  END IF;

  -- Create profile with active status
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
