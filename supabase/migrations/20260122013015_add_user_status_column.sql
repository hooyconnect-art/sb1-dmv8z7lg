/*
  # Add User Status Column

  1. Changes
    - Add `status` column to `profiles` table
      - Text field with values: 'active' or 'suspended'
      - Defaults to 'active'
    
  2. Purpose
    - Allow admin to activate or suspend user accounts
    - Enables account management and moderation
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN status text DEFAULT 'active' NOT NULL;
    
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'suspended'));
  END IF;
END $$;
