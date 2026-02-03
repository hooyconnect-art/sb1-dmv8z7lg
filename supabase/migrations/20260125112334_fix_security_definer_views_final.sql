/*
  # Fix Security Definer Views - Production Security Audit

  ## Changes
  
  1. Security Definer Views Fix
    - Drop and recreate `inquiry_listings` view with explicit SECURITY INVOKER
    - Drop and recreate `bookable_listings` view with explicit SECURITY INVOKER
    - Add security documentation comments
    - Ensure views respect RLS on underlying tables
  
  2. Security Model
    - Views use SECURITY INVOKER (caller's permissions)
    - No elevated privileges
    - Access controlled by RLS policies on source tables:
      * listings table (RLS enabled)
      * hotels table (RLS enabled)
      * guesthouses table (RLS enabled)
      * profiles table (RLS enabled)
  
  ## Impact
  
  - Resolves security audit ERROR: "Security Definer Views"
  - No breaking changes to queries
  - Maintains existing access patterns
  - Production-ready security posture
  
  ## Notes
  
  Leaked Password Protection is configured at project level:
  - Dashboard: Authentication > Settings > Password Protection
  - Enable "Check for breached passwords" (HaveIBeenPwned)
  - This cannot be configured via SQL migrations
*/

-- =====================================================
-- Fix Security Definer Views
-- Explicitly create with SECURITY INVOKER
-- =====================================================

-- Drop existing views cleanly
DROP VIEW IF EXISTS inquiry_listings CASCADE;
DROP VIEW IF EXISTS bookable_listings CASCADE;

-- Recreate inquiry_listings with explicit SECURITY INVOKER
-- Shows approved active listings for inquiry
CREATE VIEW inquiry_listings 
WITH (security_invoker = true)
AS
SELECT 
  l.id,
  l.listing_type,
  l.host_id,
  l.status,
  l.approval_status,
  h.name as hotel_name,
  h.city as hotel_city,
  g.title as guesthouse_title,
  g.city as guesthouse_city
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
LEFT JOIN guesthouses g ON g.listing_id = l.id
WHERE l.approval_status = 'approved' 
  AND l.is_active = true;

-- Document security model
COMMENT ON VIEW inquiry_listings IS 
'SECURITY: Runs with SECURITY INVOKER (caller permissions). Access controlled by RLS on underlying tables. No elevated privileges. Public read access for approved listings.';

-- Recreate bookable_listings with explicit SECURITY INVOKER
-- Shows approved, active, and available listings for online booking
CREATE VIEW bookable_listings
WITH (security_invoker = true)
AS
SELECT 
  l.id,
  l.listing_type,
  l.is_available,
  l.status,
  l.approval_status,
  l.is_active,
  l.created_at,
  h.name as hotel_name,
  h.city as hotel_city,
  g.title as guesthouse_title,
  g.city as guesthouse_city,
  g.price as guesthouse_price
FROM listings l
LEFT JOIN hotels h ON h.listing_id = l.id
LEFT JOIN guesthouses g ON g.listing_id = l.id
WHERE l.approval_status = 'approved' 
  AND l.is_active = true 
  AND l.is_available = true;

-- Document security model
COMMENT ON VIEW bookable_listings IS 
'SECURITY: Runs with SECURITY INVOKER (caller permissions). Access controlled by RLS on underlying tables. No elevated privileges. Public read access for bookable listings.';

-- =====================================================
-- Verify View Security Configuration
-- =====================================================

-- Verify views are created correctly
DO $$
BEGIN
  -- Check if views exist
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'inquiry_listings') THEN
    RAISE EXCEPTION 'inquiry_listings view was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'bookable_listings') THEN
    RAISE EXCEPTION 'bookable_listings view was not created';
  END IF;
  
  RAISE NOTICE 'Security Definer views successfully fixed - using SECURITY INVOKER';
END $$;
