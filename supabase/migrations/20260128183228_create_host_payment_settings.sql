/*
  # Host Payment Settings Schema

  ## Overview
  Creates a table to store payment and payout configuration for hosts

  ## New Tables
  1. `host_payment_settings`
     - `id` (uuid, primary key)
     - `host_id` (uuid, foreign key to profiles)
     - `payout_method` (text) - mobile_money, bank_transfer, or wallet
     - `mobile_provider` (text) - evc_plus, zaad, or edahab
     - `mobile_number` (text)
     - `bank_name` (text)
     - `bank_account_number` (text)
     - `bank_account_name` (text)
     - `is_verified` (boolean) - whether payment details are verified
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on host_payment_settings table
  - Hosts can only view/update their own payment settings
  - Super admins can view all payment settings for verification
*/

-- Create host_payment_settings table
CREATE TABLE IF NOT EXISTS host_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payout_method text NOT NULL CHECK (payout_method IN ('mobile_money', 'bank_transfer', 'wallet')),
  mobile_provider text CHECK (mobile_provider IN ('evc_plus', 'zaad', 'edahab')),
  mobile_number text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(host_id)
);

-- Enable RLS
ALTER TABLE host_payment_settings ENABLE ROW LEVEL SECURITY;

-- Hosts can view their own payment settings
CREATE POLICY "Hosts can view own payment settings"
  ON host_payment_settings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = host_id
  );

-- Hosts can insert their own payment settings
CREATE POLICY "Hosts can create own payment settings"
  ON host_payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = host_id
    AND (auth.jwt()->>'role') = 'host'
  );

-- Hosts can update their own payment settings
CREATE POLICY "Hosts can update own payment settings"
  ON host_payment_settings
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = host_id
  )
  WITH CHECK (
    auth.uid() = host_id
  );

-- Super admins can view all payment settings for verification
CREATE POLICY "Super admins can view all payment settings"
  ON host_payment_settings
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'super_admin'
  );

-- Super admins can update verification status
CREATE POLICY "Super admins can update verification status"
  ON host_payment_settings
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt()->>'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt()->>'role') = 'super_admin'
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_host_payment_settings_host_id
  ON host_payment_settings(host_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_host_payment_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_host_payment_settings_updated_at_trigger ON host_payment_settings;
CREATE TRIGGER update_host_payment_settings_updated_at_trigger
  BEFORE UPDATE ON host_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_host_payment_settings_updated_at();
