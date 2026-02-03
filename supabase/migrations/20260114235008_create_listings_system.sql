/*
  # Create Complete Listings System

  ## Overview
  This migration creates a comprehensive listing system supporting both hotels and guesthouses/furnished homes.
  
  ## New Tables
  
  ### 1. listings (Base Table)
    - `id` (uuid, primary key)
    - `host_id` (uuid, references profiles)
    - `listing_type` (text: 'hotel' | 'guesthouse')
    - `is_available` (boolean, default true)
    - `status` (text: 'pending' | 'approved' | 'rejected')
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. hotels
    - `id` (uuid, primary key)
    - `listing_id` (uuid, references listings, unique)
    - `name` (text)
    - `city` (text)
    - `address` (text)
    - `description` (text)
    - `rating` (integer, 1-5 stars, optional)
    - `amenities` (text[])
    - `check_in_time` (text)
    - `check_out_time` (text)
    - `images` (text[])
    - `created_at` (timestamptz)

  ### 3. rooms
    - `id` (uuid, primary key)
    - `hotel_id` (uuid, references hotels)
    - `room_type` (text: 'single' | 'double' | 'suite' | 'deluxe')
    - `price_per_night` (numeric)
    - `max_guests` (integer)
    - `quantity` (integer)
    - `amenities` (text[])
    - `images` (text[])
    - `created_at` (timestamptz)

  ### 4. guesthouses (renamed from properties for clarity)
    - `id` (uuid, primary key)
    - `listing_id` (uuid, references listings, unique)
    - `title` (text)
    - `property_type` (text: 'house' | 'apartment' | 'villa' | 'guesthouse')
    - `city` (text)
    - `address` (text)
    - `description` (text)
    - `price_type` (text: 'night' | 'month')
    - `price` (numeric)
    - `bedrooms` (integer)
    - `bathrooms` (integer)
    - `max_guests` (integer)
    - `amenities` (text[])
    - `images` (text[])
    - `created_at` (timestamptz)

  ### 5. waiting_list
    - `id` (uuid, primary key)
    - `listing_id` (uuid, references listings)
    - `guest_id` (uuid, references profiles)
    - `status` (text: 'pending' | 'notified' | 'booked' | 'cancelled')
    - `created_at` (timestamptz)

  ## Security (RLS Policies)
  
  ### listings
    - Hosts and admins can view their own listings
    - Guests can view approved available listings
    - Only hosts can create listings
    - Hosts can update their own listings
    
  ### hotels, rooms, guesthouses
    - Follow parent listing permissions
    - Public can view if parent listing is approved
    
  ### waiting_list
    - Guests can add themselves to waiting list
    - Guests can view their own waiting list entries
    - Hosts can view waiting list for their listings
*/

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_type text NOT NULL CHECK (listing_type IN ('hotel', 'guesthouse')),
  is_available boolean DEFAULT true NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  amenities text[] DEFAULT '{}',
  check_in_time text DEFAULT '14:00',
  check_out_time text DEFAULT '12:00',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE NOT NULL,
  room_type text NOT NULL CHECK (room_type IN ('single', 'double', 'suite', 'deluxe')),
  price_per_night numeric NOT NULL CHECK (price_per_night > 0),
  max_guests integer NOT NULL CHECK (max_guests > 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create guesthouses table
CREATE TABLE IF NOT EXISTS guesthouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  title text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('house', 'apartment', 'villa', 'guesthouse')),
  city text NOT NULL,
  address text NOT NULL,
  description text NOT NULL,
  price_type text NOT NULL CHECK (price_type IN ('night', 'month')),
  price numeric NOT NULL CHECK (price > 0),
  bedrooms integer NOT NULL CHECK (bedrooms > 0),
  bathrooms integer NOT NULL CHECK (bathrooms > 0),
  max_guests integer NOT NULL CHECK (max_guests > 0),
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  guest_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'notified', 'booked', 'cancelled')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(listing_id, guest_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_host_id ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_hotels_listing_id ON hotels(listing_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_guesthouses_listing_id ON guesthouses(listing_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_listing_id ON waiting_list(listing_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_guest_id ON waiting_list(guest_id);

-- Enable RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesthouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listings

CREATE POLICY "Hosts can view own listings"
ON listings FOR SELECT
TO authenticated
USING (
  (select auth.uid()) = host_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Public can view approved listings"
ON listings FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY "Hosts can create listings"
ON listings FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = host_id AND
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role IN ('host', 'admin'))
);

CREATE POLICY "Hosts can update own listings"
ON listings FOR UPDATE
TO authenticated
USING (
  (select auth.uid()) = host_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
)
WITH CHECK (
  (select auth.uid()) = host_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

CREATE POLICY "Admins can delete listings"
ON listings FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

-- RLS Policies for hotels

CREATE POLICY "Anyone can view approved hotel details"
ON hotels FOR SELECT
TO public
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND status = 'approved')
);

CREATE POLICY "Hosts can view own hotel details"
ON hotels FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can create hotel details"
ON hotels FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can update own hotel details"
ON hotels FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can delete own hotel details"
ON hotels FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

-- RLS Policies for rooms

CREATE POLICY "Anyone can view rooms of approved hotels"
ON rooms FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.status = 'approved'
  )
);

CREATE POLICY "Hosts can view own rooms"
ON rooms FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.host_id = (select auth.uid())
  )
);

CREATE POLICY "Hosts can create rooms"
ON rooms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.host_id = (select auth.uid())
  )
);

CREATE POLICY "Hosts can update own rooms"
ON rooms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.host_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.host_id = (select auth.uid())
  )
);

CREATE POLICY "Hosts can delete own rooms"
ON rooms FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hotels h
    JOIN listings l ON h.listing_id = l.id
    WHERE h.id = hotel_id AND l.host_id = (select auth.uid())
  )
);

-- RLS Policies for guesthouses

CREATE POLICY "Anyone can view approved guesthouses"
ON guesthouses FOR SELECT
TO public
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND status = 'approved')
);

CREATE POLICY "Hosts can view own guesthouses"
ON guesthouses FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can create guesthouses"
ON guesthouses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can update own guesthouses"
ON guesthouses FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Hosts can delete own guesthouses"
ON guesthouses FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

-- RLS Policies for waiting_list

CREATE POLICY "Guests can view own waiting list entries"
ON waiting_list FOR SELECT
TO authenticated
USING ((select auth.uid()) = guest_id);

CREATE POLICY "Hosts can view waiting list for their listings"
ON waiting_list FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

CREATE POLICY "Guests can add themselves to waiting list"
ON waiting_list FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = guest_id);

CREATE POLICY "Guests can update own waiting list entries"
ON waiting_list FOR UPDATE
TO authenticated
USING ((select auth.uid()) = guest_id)
WITH CHECK ((select auth.uid()) = guest_id);

CREATE POLICY "Hosts can update waiting list for their listings"
ON waiting_list FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND host_id = (select auth.uid()))
);

-- Update trigger for listings updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
