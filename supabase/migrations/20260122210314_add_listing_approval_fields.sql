/*
  # Add Listing Approval Fields

  ## Problem
  Listings table lacks proper approval workflow fields needed for admin review process.

  ## Changes
  1. New Columns Added to listings table:
    - approval_status: Tracks approval state (pending, approved, rejected)
    - is_active: Controls public visibility (only true for approved listings)
    - approved_by: ID of admin who approved the listing
    - approved_at: Timestamp of approval
    - rejected_at: Timestamp of rejection
    - rejection_reason: Optional reason for rejection
    - created_by_role: Role of user who created listing (host, super_admin, admin)
    - created_by_user_id: ID of user who created the listing

  ## Security
  - No RLS changes needed (existing policies still apply)
*/

-- Add approval workflow columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_by_role text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES profiles(id);

-- Add check constraint for approval_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_approval_status_check'
  ) THEN
    ALTER TABLE listings ADD CONSTRAINT listings_approval_status_check 
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_approval_status ON listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_is_active ON listings(is_active);
CREATE INDEX IF NOT EXISTS idx_listings_approved_by ON listings(approved_by);
CREATE INDEX IF NOT EXISTS idx_listings_created_by_user ON listings(created_by_user_id);

-- Update existing records to have consistent state
UPDATE listings 
SET 
  approval_status = CASE 
    WHEN status = 'approved' THEN 'approved'
    WHEN status = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  is_active = CASE 
    WHEN status = 'approved' THEN true
    ELSE false
  END,
  created_by_role = 'host',
  created_by_user_id = host_id
WHERE approval_status IS NULL OR is_active IS NULL;
