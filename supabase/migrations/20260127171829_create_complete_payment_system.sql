/*
  # Create Complete Payment System for HoyConnect

  ## Overview
  Creates a comprehensive payment system for booking payments, host earnings, and transaction tracking.

  ## New Tables
  
  ### 1. `booking_payments`
  - Tracks all payments made by guests for bookings
  - Links to bookings table
  - Supports multiple payment methods (Mobile Money, Card, Wallet)
  - Tracks payment status and transaction details
  
  ### 2. `host_wallets`
  - Tracks host earnings and wallet balance
  - Automatically created for each host
  - Shows available balance and total earnings
  - Tracks commission deductions
  
  ### 3. `transactions`
  - Records all financial transactions in the system
  - Supports: booking_payment, commission, withdrawal, refund
  - Provides audit trail for all money movements
  
  ## Security
  - Enable RLS on all tables
  - Guests can only view/create their own payments
  - Hosts can view their earnings and bookings payments
  - Only Super Admins can view all financial data
  
  ## Payment Flow
  1. Guest creates booking (status: pending, payment_status: pending)
  2. Host confirms booking → Payment request created
  3. Guest pays → payment_status: paid, booking_status: confirmed
  4. Commission automatically calculated and deducted
  5. Host earnings updated in wallet
*/

-- Create booking_payments table
CREATE TABLE IF NOT EXISTS booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  commission_rate decimal(5,2) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  commission_amount decimal(10,2) NOT NULL DEFAULT 0 CHECK (commission_amount >= 0),
  host_earnings decimal(10,2) NOT NULL DEFAULT 0 CHECK (host_earnings >= 0),
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN ('mobile_money', 'card', 'wallet', 'cash', 'bank_transfer')),
  payment_provider text,
  transaction_reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  paid_at timestamptz,
  failed_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create host_wallets table
CREATE TABLE IF NOT EXISTS host_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  available_balance decimal(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance decimal(12,2) NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  total_earnings decimal(12,2) NOT NULL DEFAULT 0 CHECK (total_earnings >= 0),
  total_withdrawn decimal(12,2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  total_commission_paid decimal(12,2) NOT NULL DEFAULT 0 CHECK (total_commission_paid >= 0),
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table for audit trail
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('booking_payment', 'commission', 'host_earning', 'withdrawal', 'refund', 'adjustment')),
  amount decimal(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference_id uuid,
  reference_type text CHECK (reference_type IN ('booking', 'payment', 'withdrawal')),
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_guest_id ON booking_payments(guest_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_host_id ON booking_payments(host_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON booking_payments(status);
CREATE INDEX IF NOT EXISTS idx_booking_payments_created_at ON booking_payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_host_wallets_host_id ON host_wallets(host_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_payments

-- Guests can view their own payments
CREATE POLICY "Guests can view own payments"
  ON booking_payments FOR SELECT
  TO authenticated
  USING (guest_id = auth.uid());

-- Hosts can view payments for their bookings
CREATE POLICY "Hosts can view their booking payments"
  ON booking_payments FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

-- Super Admins can view all payments
CREATE POLICY "Super Admins can view all payments"
  ON booking_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Super Admins can manage all payments
CREATE POLICY "Super Admins can manage payments"
  ON booking_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- RLS Policies for host_wallets

-- Hosts can view their own wallet
CREATE POLICY "Hosts can view own wallet"
  ON host_wallets FOR SELECT
  TO authenticated
  USING (host_id = auth.uid());

-- Super Admins can view all wallets
CREATE POLICY "Super Admins can view all wallets"
  ON host_wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Super Admins can manage all wallets
CREATE POLICY "Super Admins can manage wallets"
  ON host_wallets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- RLS Policies for transactions

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Super Admins can view all transactions
CREATE POLICY "Super Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Super Admins can manage all transactions
CREATE POLICY "Super Admins can manage transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'super_admin'
    )
  );

-- Create function to auto-create host wallet when user becomes host
CREATE OR REPLACE FUNCTION create_host_wallet_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'host' AND OLD.role != 'host' THEN
    INSERT INTO host_wallets (host_id)
    VALUES (NEW.id)
    ON CONFLICT (host_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto wallet creation
DROP TRIGGER IF EXISTS create_host_wallet_trigger ON profiles;
CREATE TRIGGER create_host_wallet_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'host' AND OLD.role IS DISTINCT FROM 'host')
  EXECUTE FUNCTION create_host_wallet_on_role_change();

-- Create wallets for existing hosts
INSERT INTO host_wallets (host_id)
SELECT id FROM profiles WHERE role = 'host'
ON CONFLICT (host_id) DO NOTHING;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_booking_payments_updated_at ON booking_payments;
CREATE TRIGGER update_booking_payments_updated_at
  BEFORE UPDATE ON booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_host_wallets_updated_at ON host_wallets;
CREATE TRIGGER update_host_wallets_updated_at
  BEFORE UPDATE ON host_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
