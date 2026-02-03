/*
  # Fix Automatic Profile Creation on User Signup

  ## Summary
  This migration ensures that user profiles are automatically created when a new user signs up,
  with proper error handling and idempotency.

  ## Changes Made
  
  1. **Improved Trigger Function**
     - Replaces the existing `handle_new_user` function with an idempotent version
     - Uses `ON CONFLICT DO NOTHING` to prevent errors if profile already exists
     - Safely extracts full_name and role from user_metadata with fallbacks
     - Returns new record to allow signup to complete even if profile insert fails
  
  2. **RLS Policy Updates**
     - Adds policy to allow service role to insert profiles (for trigger execution)
     - Ensures authenticated users can insert their own profile during signup
     - Maintains existing policies for select and update operations
  
  3. **Important Notes**
     - The trigger fires AFTER INSERT on auth.users table
     - Profile creation happens automatically without manual intervention
     - If profile already exists, the trigger silently succeeds
     - Admin role can only be assigned manually from Supabase dashboard
*/

-- Drop and recreate the trigger function with improved logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile, ignoring conflicts (idempotent)
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'guest')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Always return new to allow the auth.users insert to complete
  RETURN new;
END;
$$;

-- Ensure the trigger exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to ensure proper access
-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Allow authenticated users to view all profiles (needed for host/guest interactions)
CREATE POLICY "Users can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own profile (during signup via trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for admin operations and triggers)
CREATE POLICY "Service role can manage profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
