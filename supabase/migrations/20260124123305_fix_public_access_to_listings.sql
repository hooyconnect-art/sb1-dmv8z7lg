/*
  # Fix Public Access to Listings

  Allow anonymous (non-authenticated) users to view approved listings, hotels, guesthouses, and rooms.
  
  1. Security
    - Add SELECT policies for 'anon' role on:
      - listings (approved only)
      - hotels (approved listings only)
      - guesthouses (approved listings only)
      - rooms (approved listings only)
    - Public users can ONLY view approved and available content
    - All other operations still require authentication
*/

-- Allow public access to view approved listings
CREATE POLICY "Public can view approved listings"
  ON listings
  FOR SELECT
  TO anon
  USING (
    approval_status = 'approved'
    AND is_active = true
  );

-- Allow public access to view hotels with approved listings
CREATE POLICY "Public can view approved hotels"
  ON hotels
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = hotels.listing_id
        AND l.approval_status = 'approved'
        AND l.is_active = true
    )
  );

-- Allow public access to view guesthouses with approved listings
CREATE POLICY "Public can view approved guesthouses"
  ON guesthouses
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = guesthouses.listing_id
        AND l.approval_status = 'approved'
        AND l.is_active = true
    )
  );

-- Allow public access to view rooms for approved hotels
CREATE POLICY "Public can view approved hotel rooms"
  ON rooms
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM hotels h
      JOIN listings l ON l.id = h.listing_id
      WHERE h.id = rooms.hotel_id
        AND l.approval_status = 'approved'
        AND l.is_active = true
    )
  );
