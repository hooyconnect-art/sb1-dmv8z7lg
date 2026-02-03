/*
  # Fix Guest Signup - Set app_metadata in trigger

  ## Overview
  Updates the handle_new_user trigger to also update auth.users app_metadata
  so that JWT tokens contain the correct role.

  ## Changes
  - Modify handle_new_user() to update app_metadata in auth.users
  - This ensures guests get proper role in their JWT after signup

  ## Security
  - Function runs with SECURITY DEFINER to access auth schema
  - Only sets role for new user signups
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

  IF (NEW.raw_app_meta_data->>'role' IS NULL) THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
