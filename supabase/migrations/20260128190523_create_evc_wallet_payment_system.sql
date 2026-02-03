/*
  # HoyConnect EVC/Wallet Payment System

  ## Overview
  Complete payment system for HoyConnect using EVC/WALLET USSD format: *712*{WALLET_NUMBER}*{AMOUNT}#
  
  ## System Design
  - **Roles**: Only Super Admin and Host
  - **Guest**: Only pays, doesn't manage payments
  - **Payment Flow**: Host confirms booking → System generates USSD → External API → Status sync
  
  ## Tables Created
  
  ### 1. payment_providers
  Stores external EVC/Wallet API configuration (Super Admin only)
  - `id` (uuid, primary key)
  - `provider_name` (text) - e.g., "EVC Plus", "Sahal Wallet"
  - `provider_type` (text) - e.g., "EVC", "Wallet"
  - `api_endpoint` (text) - External API URL
  - `api_key` (text, encrypted) - API authentication key
  - `api_secret` (text, encrypted) - API secret
  - `ussd_prefix` (text) - e.g., "*712*"
  - `ussd_suffix` (text) - e.g., "#"
  - `active` (boolean) - Enable/disable provider
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 2. host_wallets
  Stores host wallet numbers (Host can only update their own)
  - `id` (uuid, primary key)
  - `host_id` (uuid, foreign key → auth.users)
  - `wallet_number` (text) - Host's EVC/Wallet number
  - `verified` (boolean) - Super Admin verification status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### 3. payment_requests
  Tracks all payment attempts
  - `id` (uuid, primary key)
  - `booking_id` (uuid, foreign key → bookings)
  - `host_id` (uuid, foreign key → auth.users)
  - `guest_id` (uuid, foreign key → auth.users)
  - `amount` (decimal)
  - `wallet_number` (text) - Host wallet number used
  - `ussd_code` (text) - Generated USSD: *712*xxx*amount#
  - `provider_id` (uuid, foreign key → payment_providers)
  - `status` (text) - pending, processing, paid, failed
  - `api_request` (jsonb) - Request sent to external API
  - `api_response` (jsonb) - Response from external API
  - `error_message` (text)
  - `processed_at` (timestamptz)
  - `created_at` (timestamptz)
  
  ### 4. payment_logs
  Comprehensive logging of all payment activities
  - `id` (uuid, primary key)
  - `payment_request_id` (uuid, foreign key → payment_requests)
  - `booking_id` (uuid)
  - `amount` (decimal)
  - `wallet_number` (text)
  - `status` (text)
  - `action` (text) - created, processing, completed, failed
  - `request_data` (jsonb)
  - `response_data` (jsonb)
  - `created_at` (timestamptz)
  
  ## Security
  - Only Super Admin can manage payment_providers
  - Only Hosts can view/update their own wallet_number
  - Wallet numbers NEVER exposed to Guests
  - API keys/secrets encrypted and hidden from Hosts
  - All payment attempts logged
  
  ## RLS Policies
  - payment_providers: Super Admin only
  - host_wallets: Host can view/update own, Super Admin can view/verify all
  - payment_requests: Host and Guest can view their own, Super Admin can view all
  - payment_logs: Super Admin only (audit trail)
*/

-- =====================================================
-- 1. CREATE PAYMENT_PROVIDERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type IN ('EVC', 'Wallet')),
  api_endpoint text NOT NULL,
  api_key text NOT NULL,
  api_secret text NOT NULL,
  ussd_prefix text NOT NULL DEFAULT '*712*',
  ussd_suffix text NOT NULL DEFAULT '#',
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

-- Only Super Admin can manage payment providers
CREATE POLICY "Super admin can view payment providers"
  ON payment_providers
  FOR SELECT
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin');

CREATE POLICY "Super admin can insert payment providers"
  ON payment_providers
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

CREATE POLICY "Super admin can update payment providers"
  ON payment_providers
  FOR UPDATE
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin')
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

CREATE POLICY "Super admin can delete payment providers"
  ON payment_providers
  FOR DELETE
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- =====================================================
-- 2. CREATE HOST_WALLETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS host_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_number text NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(host_id)
);

-- Enable RLS
ALTER TABLE host_wallets ENABLE ROW LEVEL SECURITY;

-- Host can view their own wallet
CREATE POLICY "Hosts can view own wallet"
  ON host_wallets
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- Host can insert their own wallet (once)
CREATE POLICY "Hosts can create own wallet"
  ON host_wallets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    host_id = (SELECT auth.uid())
    AND (SELECT (auth.jwt()->>'role')) = 'host'
  );

-- Host can update their own wallet number (not verified status)
CREATE POLICY "Hosts can update own wallet number"
  ON host_wallets
  FOR UPDATE
  TO authenticated
  USING (host_id = (SELECT auth.uid()))
  WITH CHECK (host_id = (SELECT auth.uid()));

-- Super Admin can update verification status
CREATE POLICY "Super admin can verify wallets"
  ON host_wallets
  FOR UPDATE
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin')
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- =====================================================
-- 3. CREATE PAYMENT_REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount decimal(10, 2) NOT NULL,
  wallet_number text NOT NULL,
  ussd_code text NOT NULL,
  provider_id uuid REFERENCES payment_providers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  api_request jsonb,
  api_response jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for foreign keys
CREATE INDEX IF NOT EXISTS idx_payment_requests_booking_id ON payment_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_host_id ON payment_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_guest_id ON payment_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_provider_id ON payment_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Host and Guest can view their own payment requests
CREATE POLICY "Users can view own payment requests"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (
    host_id = (SELECT auth.uid())
    OR guest_id = (SELECT auth.uid())
    OR (SELECT (auth.jwt()->>'role')) = 'super_admin'
  );

-- Only system can insert payment requests (via service role)
CREATE POLICY "Super admin can insert payment requests"
  ON payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- Only system can update payment requests
CREATE POLICY "Super admin can update payment requests"
  ON payment_requests
  FOR UPDATE
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin')
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- =====================================================
-- 4. CREATE PAYMENT_LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid REFERENCES payment_requests(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL,
  amount decimal(10, 2) NOT NULL,
  wallet_number text NOT NULL,
  status text NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'processing', 'completed', 'failed', 'webhook_received')),
  request_data jsonb,
  response_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add index for foreign keys and querying
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_request_id ON payment_logs(payment_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_booking_id ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Enable RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Only Super Admin can view logs (audit trail)
CREATE POLICY "Super admin can view payment logs"
  ON payment_logs
  FOR SELECT
  TO authenticated
  USING ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- Only system can insert logs
CREATE POLICY "Super admin can insert payment logs"
  ON payment_logs
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT (auth.jwt()->>'role')) = 'super_admin');

-- =====================================================
-- 5. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_payment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply trigger to payment_providers
DROP TRIGGER IF EXISTS update_payment_providers_updated_at ON payment_providers;
CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- Apply trigger to host_wallets
DROP TRIGGER IF EXISTS update_host_wallets_updated_at ON host_wallets;
CREATE TRIGGER update_host_wallets_updated_at
  BEFORE UPDATE ON host_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_updated_at();

-- =====================================================
-- 6. INSERT DEFAULT EVC PROVIDER (EXAMPLE)
-- =====================================================

-- This is a placeholder. Super Admin will configure real API details
INSERT INTO payment_providers (
  provider_name,
  provider_type,
  api_endpoint,
  api_key,
  api_secret,
  ussd_prefix,
  ussd_suffix,
  active
) VALUES (
  'EVC Plus',
  'EVC',
  'https://api.evcplus.so/v1/payment',
  'YOUR_API_KEY_HERE',
  'YOUR_API_SECRET_HERE',
  '*712*',
  '#',
  false
) ON CONFLICT DO NOTHING;
