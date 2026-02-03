/*
  # Add Host Property Types Column

  1. Changes
    - Add `property_types` column to `profiles` table
      - Array of text to store allowed property types (hotel, furnished, rental)
      - Defaults to empty array
      - Only relevant for users with role='host'
    
  2. Purpose
    - Allow admin to configure which property types a host can create
    - Enables granular permission control for host users
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'property_types'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN property_types text[] DEFAULT '{}';
  END IF;
END $$;
