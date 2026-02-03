/*
  # Add Super Admin Role
  
  This migration adds a 'super_admin' role to the profiles table.
  
  1. Changes
    - Drop existing role check constraint
    - Add new role check constraint including 'super_admin'
    - Update buss.conn.ai@gmail.com to super_admin role
  
  2. Security
    - Maintains existing RLS policies
    - Super admin has same privileges as admin (controlled by application logic)
*/

-- Drop the existing check constraint on role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add new check constraint that includes super_admin
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role = ANY (ARRAY['guest'::text, 'host'::text, 'admin'::text, 'super_admin'::text]));

-- Update buss.conn.ai@gmail.com to super_admin
UPDATE profiles 
SET role = 'super_admin', 
    updated_at = now()
WHERE email = 'buss.conn.ai@gmail.com';
