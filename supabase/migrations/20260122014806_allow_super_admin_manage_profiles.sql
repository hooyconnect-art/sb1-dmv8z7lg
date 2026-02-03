/*
  # Allow Super Admin to Manage All Profiles

  1. Changes
    - Add RLS policy allowing super_admin role to manage all profiles
    - This enables admin panel operations like creating/editing users
  
  2. Security
    - Only users with role='super_admin' in profiles table can manage all profiles
    - Maintains security by checking authenticated user's role
*/

-- Create policy for super admin to manage all profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Super admin can manage all profiles'
  ) THEN
    CREATE POLICY "Super admin can manage all profiles"
      ON public.profiles
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid()
          AND role = 'super_admin'
        )
      );
  END IF;
END $$;
