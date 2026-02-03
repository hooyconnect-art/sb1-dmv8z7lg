/*
  # Create Host Requests System for HoyConnect

  1. New Tables
    - `host_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `full_name` (text)
      - `phone` (text)
      - `property_type` (text)
      - `location` (text)
      - `status` (text: 'pending', 'approved', 'rejected')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `host_requests` table
    - Guests can create their own requests
    - Guests can view their own requests
    - Admins can view all requests
    - Admins can update request status
*/

-- Create host_requests table
CREATE TABLE IF NOT EXISTS host_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  property_type text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE host_requests ENABLE ROW LEVEL SECURITY;

-- Guests can create their own host requests
CREATE POLICY "Guests can create host requests"
  ON host_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = user_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'guest'
    )
  );

-- Users can view their own host requests
CREATE POLICY "Users can view own host requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Admins can view all host requests
CREATE POLICY "Admins can view all host requests"
  ON host_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update host request status
CREATE POLICY "Admins can update host requests"
  ON host_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid())
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_host_requests_updated_at()
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

-- Create trigger for updated_at
CREATE TRIGGER set_host_requests_updated_at
  BEFORE UPDATE ON host_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_host_requests_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_host_requests_user_id ON host_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_host_requests_status ON host_requests(status);
