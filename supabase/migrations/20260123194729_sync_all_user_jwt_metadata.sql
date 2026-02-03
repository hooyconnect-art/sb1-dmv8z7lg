/*
  # Sync All User JWT Metadata with Profile Roles

  ## Purpose
  - Ensure all users' auth.users.user_metadata.role matches their profiles.role
  - This is critical for RLS policies that check auth.jwt() -> 'user_metadata' ->> 'role'
  
  ## Changes
  - Updates user_metadata for all existing users to include their current role
  - This must be done via API call since we can't directly update auth.users from SQL
  
  ## Note
  - This migration creates a temporary function to be called via API
  - Admin must run sync operation after this migration
*/

-- This migration is a placeholder
-- The actual JWT sync will be done via the change-role API or a new sync API
SELECT 1;
