/*
  # Drop Unused Database Indexes

  ## Overview
  Removes database indexes that are not being used by queries to improve write performance
  and reduce storage overhead.

  ## Changes
  1. Drop unused indexes on properties table:
     - idx_properties_host_id
     - idx_properties_city
  
  2. Drop unused indexes on bookings table:
     - idx_bookings_property_id
     - idx_bookings_guest_id
     - idx_bookings_dates
  
  3. Drop unused indexes on reviews table:
     - idx_reviews_property_id
     - idx_reviews_booking_id
     - idx_reviews_guest_id
  
  4. Drop unused indexes on listings table:
     - idx_listings_type
  
  5. Drop unused indexes on payments table:
     - idx_payments_booking_id
  
  6. Drop unused indexes on host_requests table:
     - idx_host_requests_status

  ## Impact
  - Improved INSERT/UPDATE performance
  - Reduced storage usage
  - No impact on query performance (indexes were not being used)

  ## Notes
  - If these queries become slow in the future, indexes can be recreated
  - Foreign key constraints still provide their own indexes
*/

-- Drop unused indexes on properties table
DROP INDEX IF EXISTS idx_properties_host_id;
DROP INDEX IF EXISTS idx_properties_city;

-- Drop unused indexes on bookings table
DROP INDEX IF EXISTS idx_bookings_property_id;
DROP INDEX IF EXISTS idx_bookings_guest_id;
DROP INDEX IF EXISTS idx_bookings_dates;

-- Drop unused indexes on reviews table
DROP INDEX IF EXISTS idx_reviews_property_id;
DROP INDEX IF EXISTS idx_reviews_booking_id;
DROP INDEX IF EXISTS idx_reviews_guest_id;

-- Drop unused indexes on listings table
DROP INDEX IF EXISTS idx_listings_type;

-- Drop unused indexes on payments table
DROP INDEX IF EXISTS idx_payments_booking_id;

-- Drop unused indexes on host_requests table
DROP INDEX IF EXISTS idx_host_requests_status;
