/*
  # Add Admin Access Policies

  ## Overview
  This migration adds RLS policies to allow admins full access to critical tables
  while preserving existing guest and host permissions.

  ## Changes
  
  1. **Profiles Table**
     - Add policy for admins to update any user's role
  
  2. **Bookings Table**
     - Add policy for admins to view all bookings
     - Add policy for admins to update any booking
  
  3. **Waiting List Table**
     - Add policy for admins to view all waiting list entries
     - Add policy for admins to update/delete any waiting list entry

  ## Security
  - Only users with profiles.role = 'admin' can access these policies
  - Existing guest and host policies remain unchanged
  - Admin policies are additive, not replacing existing permissions
*/

-- Profiles: Allow admins to update any user's role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update user roles'
  ) THEN
    CREATE POLICY "Admins can update user roles"
    ON profiles FOR UPDATE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;

-- Bookings: Allow admins to view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can view all bookings'
  ) THEN
    CREATE POLICY "Admins can view all bookings"
    ON bookings FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;

-- Bookings: Allow admins to update any booking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can update any booking'
  ) THEN
    CREATE POLICY "Admins can update any booking"
    ON bookings FOR UPDATE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;

-- Waiting List: Allow admins to view all entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'Admins can view all waiting list entries'
  ) THEN
    CREATE POLICY "Admins can view all waiting list entries"
    ON waiting_list FOR SELECT
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;

-- Waiting List: Allow admins to update any entry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'Admins can update waiting list entries'
  ) THEN
    CREATE POLICY "Admins can update waiting list entries"
    ON waiting_list FOR UPDATE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;

-- Waiting List: Allow admins to delete any entry
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'Admins can delete waiting list entries'
  ) THEN
    CREATE POLICY "Admins can delete waiting list entries"
    ON waiting_list FOR DELETE
    TO authenticated
    USING (
      EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
    );
  END IF;
END $$;
