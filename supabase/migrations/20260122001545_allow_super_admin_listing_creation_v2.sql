/*
  # Allow Super Admin to Create Listings

  1. RLS Policy Updates
    - Add policy for super admins to insert listings
    - Add policies for super admins to insert hotels and guesthouses
    - Ensures super admins can use the admin panel to create listings directly

  2. Security
    - Maintains existing RLS policies
    - Only allows authenticated super admins to create listings
    - Auto-approves listings created by super admins
*/

-- Allow super admins to create listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'listings'
    AND policyname = 'Super admins can create listings'
  ) THEN
    CREATE POLICY "Super admins can create listings"
    ON listings FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'super_admin'
      )
    );
  END IF;
END $$;

-- Allow super admins to create hotels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'hotels'
    AND policyname = 'Super admins can create hotels'
  ) THEN
    CREATE POLICY "Super admins can create hotels"
    ON hotels FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM listings l
        JOIN profiles p ON p.id = l.host_id
        WHERE l.id = listing_id
        AND p.role = 'super_admin'
        AND p.id = (SELECT auth.uid())
      )
    );
  END IF;
END $$;

-- Allow super admins to create guesthouses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'guesthouses'
    AND policyname = 'Super admins can create guesthouses'
  ) THEN
    CREATE POLICY "Super admins can create guesthouses"
    ON guesthouses FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM listings l
        JOIN profiles p ON p.id = l.host_id
        WHERE l.id = listing_id
        AND p.role = 'super_admin'
        AND p.id = (SELECT auth.uid())
      )
    );
  END IF;
END $$;

-- Allow super admins to delete hotels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'hotels'
    AND policyname = 'Super admins can delete hotels'
  ) THEN
    CREATE POLICY "Super admins can delete hotels"
    ON hotels FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'super_admin'
      )
    );
  END IF;
END $$;

-- Allow super admins to delete guesthouses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'guesthouses'
    AND policyname = 'Super admins can delete guesthouses'
  ) THEN
    CREATE POLICY "Super admins can delete guesthouses"
    ON guesthouses FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'super_admin'
      )
    );
  END IF;
END $$;