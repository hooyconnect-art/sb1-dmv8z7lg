/*
  # Fix Payments Table for HoyConnect

  ## Overview
  The existing payments table is from a different project. We need to add proper columns
  for HoyConnect booking payments while preserving existing data.

  ## Changes
  - Add booking_id column linking to bookings
  - Add payment_status column (different from status)
  - Keep existing columns for backward compatibility

  ## Important Notes
  - Existing payments with business_id remain unchanged
  - New HoyConnect payments will use booking_id
*/

-- Add booking_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
  END IF;
END $$;

-- Add payment_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN payment_status text DEFAULT 'pending' 
      CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));
  END IF;
END $$;

-- Update RLS policies for HoyConnect bookings
DROP POLICY IF EXISTS "Users can view own booking payments" ON payments;
CREATE POLICY "Users can view own booking payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    booking_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
        AND bookings.guest_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
CREATE POLICY "Admins can manage all payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
