/*
  # Add Approval Fields to Listings Table

  ## Overview
  This migration adds additional fields to support full approval workflow functionality.

  ## Changes to `listings` table:
    - `is_featured` (boolean, default false) - Mark listing as featured
    - `is_active` (boolean, default false) - Control if listing is active
    - `approval_status` (text) - Duplicate of status for clarity
    - `approved_by` (uuid, nullable) - References profile who approved
    - `approved_at` (timestamptz, nullable) - When listing was approved
    - `rejected_at` (timestamptz, nullable) - When listing was rejected
    - `rejection_reason` (text, nullable) - Reason for rejection

  ## Important Notes
    - These fields support admin approval workflow
    - `is_featured` allows admins to highlight specific listings
    - `is_active` controls whether listing shows in app
*/

-- Add new columns to listings table
DO $$ 
BEGIN
  -- Add is_featured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE listings ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
  END IF;

  -- Add is_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE listings ADD COLUMN is_active boolean DEFAULT false NOT NULL;
  END IF;

  -- Add approval_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE listings ADD COLUMN approval_status text DEFAULT 'pending' NOT NULL 
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- Add approved_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE listings ADD COLUMN approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  -- Add approved_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN approved_at timestamptz;
  END IF;

  -- Add rejected_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'rejected_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN rejected_at timestamptz;
  END IF;

  -- Add rejection_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE listings ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_approval_status ON listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_approved_by ON listings(approved_by);
