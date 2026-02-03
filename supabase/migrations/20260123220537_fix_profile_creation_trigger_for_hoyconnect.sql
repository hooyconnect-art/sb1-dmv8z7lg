/*
  # Fix Profile Creation Trigger for HoyConnect

  ## Overview
  This migration updates the automatic profile creation trigger to work with HoyConnect schema.

  ## Changes
  - Update handle_new_user() function to use correct HoyConnect role ('guest' instead of 'citizen')
  - Add missing columns: status, verified
  - Get role from app_metadata if available

  ## Important Notes
  - This ensures new users automatically get profiles with correct HoyConnect structure
*/

-- Drop and recreate the handle_new_user function with correct HoyConnect schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  -- Insert profile with HoyConnect schema
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
    COALESCE(NEW.raw_app_meta_data->>'role', 'guest'),
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
