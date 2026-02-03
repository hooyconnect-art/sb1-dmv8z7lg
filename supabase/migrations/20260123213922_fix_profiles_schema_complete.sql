/*
  # Fix Profiles Schema - Add Missing Columns

  1. Changes
    - Update old roles to new system (citizen/driver/supervisor → guest)
    - Add `status` column (active/suspended/deleted)
    - Add `verified` column (boolean)
    - Add `property_types` column (text array for hosts)
    - Update role constraint
    
  2. Data Migration
    - Maps old roles to new roles
    - Sets default values for new columns
*/

-- Step 1: Map old roles to new roles
UPDATE profiles SET role = 'guest' WHERE role IN ('citizen', 'driver', 'supervisor', 'business');

-- Step 2: Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- Step 3: Add verified column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'verified'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN verified boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Step 4: Add property_types column if it doesn't exist
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

-- Step 5: Drop old role constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

-- Step 6: Add new role constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('guest', 'host', 'admin', 'super_admin'));

-- Step 7: Add status constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'suspended', 'deleted'));
  END IF;
END $$;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(verified);