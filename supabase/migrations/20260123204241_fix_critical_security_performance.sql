-- Fix CRITICAL SECURITY VULNERABILITY: Replace user_metadata with app_metadata
-- Fix Performance: Wrap auth functions in SELECT
-- Drop unused indexes

-- Fix listings policies
DROP POLICY IF EXISTS "Admin can view all listings" ON listings;
DROP POLICY IF EXISTS "Host can view own listings" ON listings;
DROP POLICY IF EXISTS "Admin can update all listings" ON listings;
DROP POLICY IF EXISTS "Host can update own listings" ON listings;

CREATE POLICY "Admin can view all listings"
ON listings FOR SELECT TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Host can view own listings"
ON listings FOR SELECT TO authenticated
USING (host_id = (select auth.uid()) AND ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'host');

CREATE POLICY "Admin can update all listings"
ON listings FOR UPDATE TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'))
WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Host can update own listings"
ON listings FOR UPDATE TO authenticated
USING (host_id = (select auth.uid()) AND ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'host')
WITH CHECK (host_id = (select auth.uid()) AND ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'host');

-- Fix profiles policies
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;

CREATE POLICY "Admin can update all profiles"
ON profiles FOR UPDATE TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'))
WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Admin can insert profiles"
ON profiles FOR INSERT TO authenticated
WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Admin can delete profiles"
ON profiles FOR DELETE TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

-- Fix host_requests policies
DROP POLICY IF EXISTS "Super admins and admins can view all host requests" ON host_requests;
DROP POLICY IF EXISTS "Super admins and admins can update host requests" ON host_requests;
DROP POLICY IF EXISTS "Super admins and admins can delete host requests" ON host_requests;

CREATE POLICY "Super admins and admins can view all host requests"
ON host_requests FOR SELECT TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Super admins and admins can update host requests"
ON host_requests FOR UPDATE TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'))
WITH CHECK (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

CREATE POLICY "Super admins and admins can delete host requests"
ON host_requests FOR DELETE TO authenticated
USING (((select auth.jwt()) -> 'app_metadata' ->> 'role') IN ('admin', 'super_admin'));

-- Drop unused indexes
DROP INDEX IF EXISTS idx_cities_country;
DROP INDEX IF EXISTS idx_areas_city;
DROP INDEX IF EXISTS idx_property_sales_host;
DROP INDEX IF EXISTS idx_property_sales_status;
DROP INDEX IF EXISTS idx_property_sales_location;
DROP INDEX IF EXISTS idx_property_sales_area;
DROP INDEX IF EXISTS idx_property_sales_city;
DROP INDEX IF EXISTS idx_property_sales_is_featured;
DROP INDEX IF EXISTS idx_sales_inquiries_buyer;
DROP INDEX IF EXISTS idx_sales_inquiries_status;
DROP INDEX IF EXISTS idx_sales_inquiries_property_sale_id;
DROP INDEX IF EXISTS idx_featured_listings_active;
DROP INDEX IF EXISTS idx_featured_listings_created_by;
DROP INDEX IF EXISTS idx_featured_listings_listing;
DROP INDEX IF EXISTS idx_featured_listings_property_sale;
DROP INDEX IF EXISTS idx_bookings_guest;
DROP INDEX IF EXISTS idx_bookings_property;
DROP INDEX IF EXISTS idx_bookings_booking_type;
DROP INDEX IF EXISTS idx_bookings_listing_id;
DROP INDEX IF EXISTS idx_bookings_status;
DROP INDEX IF EXISTS idx_bookings_payment_status;
DROP INDEX IF EXISTS idx_bookings_created_at;
DROP INDEX IF EXISTS idx_bookings_room_id;
DROP INDEX IF EXISTS idx_properties_host;
DROP INDEX IF EXISTS idx_reviews_booking;
DROP INDEX IF EXISTS idx_reviews_guest;
DROP INDEX IF EXISTS idx_reviews_property;
DROP INDEX IF EXISTS idx_commission_settings_updated_by;
DROP INDEX IF EXISTS idx_website_content_updated_by;
DROP INDEX IF EXISTS idx_listings_listing_type;
DROP INDEX IF EXISTS idx_listings_is_featured;
DROP INDEX IF EXISTS idx_listings_approval_status;
DROP INDEX IF EXISTS idx_listings_is_active;
DROP INDEX IF EXISTS idx_listings_approved_by;
DROP INDEX IF EXISTS idx_listings_created_by_user;
DROP INDEX IF EXISTS idx_profiles_role;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_payments_payment_status;
DROP INDEX IF EXISTS idx_payments_booking_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_guesthouses_area_id;
DROP INDEX IF EXISTS idx_guesthouses_city_id;
DROP INDEX IF EXISTS idx_guesthouses_country_id;
DROP INDEX IF EXISTS idx_hotels_area_id;
DROP INDEX IF EXISTS idx_hotels_city_id;
DROP INDEX IF EXISTS idx_hotels_country_id;
DROP INDEX IF EXISTS idx_listing_inquiries_guest_id;
DROP INDEX IF EXISTS idx_listing_inquiries_status;
DROP INDEX IF EXISTS idx_listing_inquiries_created_at;
