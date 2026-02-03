/*
  # Remove Collector and Supervisor Roles

  ## Changes
  - Remove 'collector' and 'supervisor' from role CHECK constraint
  - Only allow: guest, host, admin, super_admin
  - Clean up any existing users with these roles (set to guest)

  ## Security
  - Maintains existing RLS policies
  - No data loss - converts old roles to guest
*/

-- Update any existing users with collector or supervisor role to guest
UPDATE profiles 
SET role = 'guest' 
WHERE role IN ('collector', 'supervisor');

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with only 4 allowed roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['guest'::text, 'host'::text, 'admin'::text, 'super_admin'::text]));
