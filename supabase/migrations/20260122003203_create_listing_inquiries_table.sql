/*
  # Create Listing Inquiries System

  ## Overview
  This migration creates a comprehensive inquiries system for guests to contact hosts about their listings.

  ## New Tables
  
  ### 1. listing_inquiries
    - `id` (uuid, primary key)
    - `listing_id` (uuid, references listings)
    - `guest_id` (uuid, references profiles)
    - `guest_name` (text)
    - `guest_email` (text)
    - `guest_phone` (text, optional)
    - `message` (text)
    - `status` (text: 'new' | 'replied' | 'closed')
    - `admin_notes` (text, optional)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Indexes
    - Index on listing_id for fast host queries
    - Index on guest_id for guest query performance
    - Index on status for filtering

  ## Security (RLS Policies)
    - Guests can create inquiries
    - Guests can view their own inquiries
    - Hosts can view inquiries for their listings
    - Hosts can update inquiries for their listings (status, notes)
    - Super admins can view and manage all inquiries
*/

-- Create listing_inquiries table
CREATE TABLE IF NOT EXISTS listing_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  guest_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text,
  message text NOT NULL,
  status text DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'replied', 'closed')),
  admin_notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_listing_id ON listing_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_guest_id ON listing_inquiries(guest_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_status ON listing_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_created_at ON listing_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE listing_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Guests can create inquiries
CREATE POLICY "Guests can create inquiries"
ON listing_inquiries FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = guest_id OR
  guest_id IS NULL
);

-- Allow anonymous users to create inquiries (with guest_id as null)
CREATE POLICY "Anonymous users can create inquiries"
ON listing_inquiries FOR INSERT
TO anon
WITH CHECK (guest_id IS NULL);

-- Guests can view their own inquiries
CREATE POLICY "Guests can view own inquiries"
ON listing_inquiries FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = guest_id
);

-- Hosts can view inquiries for their listings
CREATE POLICY "Hosts can view inquiries for their listings"
ON listing_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_id
    AND listings.host_id = (SELECT auth.uid())
  )
);

-- Super admins can view all inquiries
CREATE POLICY "Super admins can view all inquiries"
ON listing_inquiries FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'super_admin'
  )
);

-- Hosts can update inquiries for their listings
CREATE POLICY "Hosts can update inquiries for their listings"
ON listing_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_id
    AND listings.host_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_id
    AND listings.host_id = (SELECT auth.uid())
  )
);

-- Super admins can update all inquiries
CREATE POLICY "Super admins can update all inquiries"
ON listing_inquiries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'super_admin'
  )
);

-- Super admins can delete inquiries
CREATE POLICY "Super admins can delete inquiries"
ON listing_inquiries FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.role = 'super_admin'
  )
);

-- Update trigger for updated_at
CREATE TRIGGER update_listing_inquiries_updated_at
BEFORE UPDATE ON listing_inquiries
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();