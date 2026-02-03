/*
  # Add Collector and Supervisor Roles

  1. Changes
    - Update role CHECK constraint to include 'collector' and 'supervisor'
    - Ensure existing role constraint is properly expanded

  2. Security
    - No changes to RLS policies (handled separately)
*/

-- Drop existing constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new constraint with collector and supervisor roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['guest'::text, 'host'::text, 'collector'::text, 'supervisor'::text, 'admin'::text, 'super_admin'::text]));
