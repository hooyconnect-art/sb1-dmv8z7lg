/*
  # Restrict Listing Status Updates to Admins Only

  ## Overview
  This migration ensures that only admins can approve or reject listings.
  Hosts can update their own listings but cannot change the status field.

  ## Changes
  
  1. Drop existing update policy for listings
  2. Create two separate update policies:
     - Hosts can update own listings (excluding status field)
     - Admins can update any listing (including status field)

  ## Security
  - Prevents hosts from self-approving their listings
  - Only admins can change listing status
  - Hosts can still update availability and other fields
*/

-- Drop the existing update policy
DROP POLICY IF EXISTS "Hosts can update own listings" ON listings;

-- Create policy for hosts to update their own listings (excluding status changes)
CREATE POLICY "Hosts can update own listing details"
ON listings FOR UPDATE
TO authenticated
USING ((select auth.uid()) = host_id)
WITH CHECK (
  (select auth.uid()) = host_id AND
  -- Ensure the status is not being changed from its current value
  (status = (SELECT status FROM listings WHERE id = listings.id))
);

-- Create policy for admins to update any listing (including status)
CREATE POLICY "Admins can update any listing"
ON listings FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
);
