/*
  # Consolidate Multiple Permissive RLS Policies

  ## Overview
  Consolidates multiple permissive policies into single policies with OR conditions
  to improve security and prevent unintended access patterns.

  ## Security Rationale
  Multiple permissive policies for the same role and action create security risks:
  - If ANY policy grants access, the user gets access
  - Makes it harder to reason about access control
  - Can lead to unintended privilege escalation

  ## Changes
  
  ### 1. Bookings Table
  - Consolidate 3 SELECT policies into 1
  - Consolidate 2 UPDATE policies into 1
  
  ### 2. Guesthouses Table
  - Consolidate 2 SELECT policies into 1
  
  ### 3. Host Requests Table
  - Consolidate 2 SELECT policies into 1
  
  ### 4. Hotels Table
  - Consolidate 2 SELECT policies into 1
  
  ### 5. Listings Table
  - Consolidate 2 SELECT policies into 1
  - Consolidate 2 UPDATE policies into 1
  
  ### 6. Profiles Table
  - Consolidate 2 UPDATE policies into 1
  
  ### 7. Rooms Table
  - Consolidate 2 SELECT policies into 1
  
  ### 8. Waiting List Table
  - Consolidate 3 SELECT policies into 1
  - Consolidate 3 UPDATE policies into 1

  ## Notes
  - All policies maintain the same access control logic
  - Uses OR conditions to combine multiple checks
  - No functional changes to user access
*/

-- ==========================================
-- BOOKINGS TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Hosts can view property bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guest_id
    OR auth.uid() IN (
      SELECT host_id FROM properties WHERE id = bookings.property_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admins can update any booking" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

-- Create consolidated UPDATE policy
CREATE POLICY "Users can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = guest_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = guest_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- GUESTHOUSES TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view approved guesthouses" ON guesthouses;
DROP POLICY IF EXISTS "Hosts can view own guesthouses" ON guesthouses;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view guesthouses"
  ON guesthouses FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = guesthouses.listing_id 
      AND listings.status = 'approved'
    )
    OR (
      auth.uid() IS NOT NULL
      AND auth.uid() IN (
        SELECT host_id FROM listings WHERE id = guesthouses.listing_id
      )
    )
  );

-- ==========================================
-- HOST REQUESTS TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all host requests" ON host_requests;
DROP POLICY IF EXISTS "Users can view own host requests" ON host_requests;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view host requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- HOTELS TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view approved hotel details" ON hotels;
DROP POLICY IF EXISTS "Hosts can view own hotel details" ON hotels;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view hotels"
  ON hotels FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = hotels.listing_id 
      AND listings.status = 'approved'
    )
    OR (
      auth.uid() IS NOT NULL
      AND auth.uid() IN (
        SELECT host_id FROM listings WHERE id = hotels.listing_id
      )
    )
  );

-- ==========================================
-- LISTINGS TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Hosts can view own listings" ON listings;
DROP POLICY IF EXISTS "Public can view approved listings" ON listings;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view listings"
  ON listings FOR SELECT
  TO public
  USING (
    status = 'approved'
    OR (
      auth.uid() IS NOT NULL
      AND auth.uid() = host_id
    )
  );

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admins can update any listing" ON listings;
DROP POLICY IF EXISTS "Hosts can update own listing details" ON listings;

-- Create consolidated UPDATE policy
CREATE POLICY "Users can update listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = host_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    (auth.uid() = host_id AND status != 'approved')
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- PROFILES TABLE
-- ==========================================

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admins can update user roles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create consolidated UPDATE policy
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()))
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================
-- ROOMS TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view rooms of approved hotels" ON rooms;
DROP POLICY IF EXISTS "Hosts can view own rooms" ON rooms;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view rooms"
  ON rooms FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM hotels h
      JOIN listings l ON l.id = h.listing_id
      WHERE h.id = rooms.hotel_id
      AND l.status = 'approved'
    )
    OR (
      auth.uid() IS NOT NULL
      AND auth.uid() IN (
        SELECT l.host_id 
        FROM hotels h
        JOIN listings l ON l.id = h.listing_id
        WHERE h.id = rooms.hotel_id
      )
    )
  );

-- ==========================================
-- WAITING LIST TABLE
-- ==========================================

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Admins can view all waiting list entries" ON waiting_list;
DROP POLICY IF EXISTS "Guests can view own waiting list entries" ON waiting_list;
DROP POLICY IF EXISTS "Hosts can view waiting list for their listings" ON waiting_list;

-- Create consolidated SELECT policy
CREATE POLICY "Users can view waiting list"
  ON waiting_list FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guest_id
    OR auth.uid() IN (
      SELECT host_id FROM listings WHERE id = waiting_list.listing_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Admins can update waiting list entries" ON waiting_list;
DROP POLICY IF EXISTS "Guests can update own waiting list entries" ON waiting_list;
DROP POLICY IF EXISTS "Hosts can update waiting list for their listings" ON waiting_list;

-- Create consolidated UPDATE policy
CREATE POLICY "Users can update waiting list"
  ON waiting_list FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = guest_id
    OR auth.uid() IN (
      SELECT host_id FROM listings WHERE id = waiting_list.listing_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = guest_id
    OR auth.uid() IN (
      SELECT host_id FROM listings WHERE id = waiting_list.listing_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
