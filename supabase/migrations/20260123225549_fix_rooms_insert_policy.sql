/*
  # Fix Rooms Insert Policy

  ## Overview
  Add proper WITH CHECK constraint to rooms insert policy to ensure hosts can only create rooms for their own hotels.

  ## Changes
  - Drop and recreate "Hosts can create rooms" policy with proper WITH CHECK clause

  ## Security
  - Hosts can only create rooms for hotels they own
  - Admins and super_admins can create rooms for any hotel
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Hosts can create rooms" ON rooms;

-- Recreate with proper WITH CHECK
CREATE POLICY "Hosts can create rooms"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM hotels h
      JOIN listings l ON h.listing_id = l.id
      WHERE h.id = rooms.hotel_id
        AND (
          l.host_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin')
          )
        )
    )
  );
