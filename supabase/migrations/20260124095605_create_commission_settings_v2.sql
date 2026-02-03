/*
  # Commission Settings System V2

  1. New Tables
    - `commission_settings` - Stores commission rates for each property type
  
  2. Property Types
    - Hotel (15%)
    - Fully Furnished (12%)
    - Property for Sale (0% - custom per transaction)
    
  3. Security
    - Enable RLS
    - Super admins can modify
    - All authenticated users can read
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS commission_settings CASCADE;

-- Create commission_settings table
CREATE TABLE commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_type text UNIQUE NOT NULL,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- Service role policy
DROP POLICY IF EXISTS "commission_settings_service_role" ON commission_settings;
CREATE POLICY "commission_settings_service_role"
  ON commission_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read
DROP POLICY IF EXISTS "Anyone can read commission settings" ON commission_settings;
CREATE POLICY "Anyone can read commission settings"
  ON commission_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only super_admins can modify
DROP POLICY IF EXISTS "Super admins can modify commission settings" ON commission_settings;
CREATE POLICY "Super admins can modify commission settings"
  ON commission_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Insert default commission rates
INSERT INTO commission_settings (property_type, commission_rate, description) 
VALUES
  ('Hotel', 15.00, 'Commission applied per confirmed hotel booking'),
  ('Fully Furnished', 12.00, 'Commission applied per confirmed furnished property booking'),
  ('Property for Sale', 0.00, 'Custom commission per sale - configured manually per transaction');

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_commission_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS commission_settings_updated_at ON commission_settings;
CREATE TRIGGER commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_commission_settings_updated_at();
