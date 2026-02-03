/*
  # Fix Auto Profile Creation for All New Users

  ## Problem
  When new users are created in auth.users (via signup or admin creation),
  no corresponding profile is automatically created in the profiles table.
  This causes users to disappear from Admin → Users Management dashboard.

  ## Solution
  Create a database trigger that automatically creates a profile for every new auth.users entry.

  ## Changes
  1. Create/Replace handle_new_user() function
     - Automatically inserts a row into profiles when a user is created
     - Extracts role from raw_user_meta_data (defaults to 'guest')
     - Extracts full_name from raw_user_meta_data if available
  
  2. Create trigger on auth.users
     - Fires AFTER INSERT on auth.users
     - Calls handle_new_user() for each new user
  
  ## Impact
  - Guest signup → profile auto-created
  - Admin creates Host → profile auto-created
  - Admin creates Collector/Supervisor → profile auto-created
  - No more missing users in Admin dashboard
*/

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    verified
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'guest'),
    'active',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
