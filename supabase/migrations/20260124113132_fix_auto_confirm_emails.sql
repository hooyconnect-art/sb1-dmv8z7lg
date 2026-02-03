/*
  # Auto-confirm emails for new users
  
  ## Overview
  Automatically confirms email addresses for new user signups to allow immediate login.
  This is required for the MVP to work without email confirmation flow.
  
  ## Changes
  - Update handle_new_user trigger to auto-confirm emails
  - Set email_confirmed_at and confirmed_at timestamps
  
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

  -- Set role in app_metadata if not already set
  IF (NEW.raw_app_meta_data->>'role' IS NULL) THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role)
    WHERE id = NEW.id;
  END IF;

  -- Auto-confirm email to allow immediate login
  IF (NEW.email_confirmed_at IS NULL) THEN
    UPDATE auth.users
    SET 
      email_confirmed_at = now(),
      confirmed_at = now()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
