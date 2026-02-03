/*
  # Add Furnished and Rental Listing Types

  1. Changes
    - Update listings table listing_type constraint to include 'furnished' and 'rental'
    - Adds support for new listing types while maintaining backward compatibility

  2. Security
    - No RLS policy changes needed
    - Maintains existing security model
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'listings_listing_type_check'
  ) THEN
    ALTER TABLE listings DROP CONSTRAINT listings_listing_type_check;
  END IF;
END $$;

-- Add new constraint with additional listing types
ALTER TABLE listings
ADD CONSTRAINT listings_listing_type_check
CHECK (listing_type IN ('hotel', 'guesthouse', 'furnished', 'rental'));
