/*
  # Super Admin Dashboard Complete Schema
  
  This migration creates all necessary tables for the HoyConnect Super Admin Dashboard.
  
  ## New Tables Created
  
  ### 1. Location Management
    - `countries` - Country master data
    - `cities` - Cities within countries
    - `areas` - Areas/neighborhoods within cities
  
  ### 2. Property Sales
    - `property_sales` - Properties listed for sale
    - `sales_inquiries` - Buyer inquiries for properties
  
  ### 3. Configuration
    - `property_types` - Property type definitions
    - `amenities` - Available amenities
    - `payment_methods` - Supported payment methods
    - `commission_settings` - Commission rates per listing type
  
  ### 4. Content Management
    - `website_content` - Homepage and content sections
    - `featured_listings` - Featured property promotions
  
  ### 5. System
    - `audit_logs` - System activity tracking
  
  ## Security
    - All tables have RLS enabled
    - Super admin and admin have full access
    - Hosts can view/manage their own records
    - Guests have read-only access where appropriate
*/

-- ============================================
-- LOCATION MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid REFERENCES countries(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(country_id, name)
);

CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(city_id, name)
);

-- ============================================
-- PROPERTY SALES
-- ============================================

CREATE TABLE IF NOT EXISTS property_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  property_type text NOT NULL,
  country_id uuid REFERENCES countries(id),
  city_id uuid REFERENCES cities(id),
  area_id uuid REFERENCES areas(id),
  address text NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  size_sqm numeric,
  bedrooms integer,
  bathrooms integer,
  amenities text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sold')),
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_sale_id uuid REFERENCES property_sales(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id),
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL,
  message text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'closed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('rental', 'hotel', 'guesthouse', 'sale')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('mobile_money', 'card', 'bank_transfer', 'cash')),
  provider text,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type text NOT NULL UNIQUE CHECK (listing_type IN ('rental', 'hotel', 'guesthouse', 'sale')),
  commission_percentage numeric NOT NULL CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- CONTENT MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS website_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text,
  content text,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  updated_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS featured_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  property_sale_id uuid REFERENCES property_sales(id) ON DELETE CASCADE,
  position integer DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT featured_listings_check CHECK (
    (listing_id IS NOT NULL AND property_sale_id IS NULL) OR
    (listing_id IS NULL AND property_sale_id IS NOT NULL)
  )
);

-- ============================================
-- SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country_id);
CREATE INDEX IF NOT EXISTS idx_areas_city ON areas(city_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_host ON property_sales(host_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_status ON property_sales(status);
CREATE INDEX IF NOT EXISTS idx_property_sales_location ON property_sales(country_id, city_id, area_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_property ON sales_inquiries(property_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_buyer ON sales_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_status ON sales_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_featured_listings_active ON featured_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Countries
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active countries"
  ON countries FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage countries"
  ON countries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Cities
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities"
  ON cities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage cities"
  ON cities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Areas
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active areas"
  ON areas FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage areas"
  ON areas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Property Sales
ALTER TABLE property_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved property sales"
  ON property_sales FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Hosts can manage own property sales"
  ON property_sales FOR ALL
  TO authenticated
  USING (auth.uid() = host_id);

CREATE POLICY "Super admin and admin can manage all property sales"
  ON property_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Sales Inquiries
ALTER TABLE sales_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own inquiries"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE property_sales.id = sales_inquiries.property_sale_id
      AND property_sales.host_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create inquiries"
  ON sales_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Property owners can update inquiries for their properties"
  ON sales_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE property_sales.id = sales_inquiries.property_sale_id
      AND property_sales.host_id = auth.uid()
    )
  );

CREATE POLICY "Super admin and admin can manage all inquiries"
  ON sales_inquiries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Property Types
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active property types"
  ON property_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage property types"
  ON property_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Amenities
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active amenities"
  ON amenities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage amenities"
  ON amenities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Commission Settings
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view commission settings"
  ON commission_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin and admin can manage commission settings"
  ON commission_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Website Content
ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active website content"
  ON website_content FOR SELECT
  USING (is_active = true);

CREATE POLICY "Super admin and admin can manage website content"
  ON website_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Featured Listings
ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured listings"
  ON featured_listings FOR SELECT
  USING (
    is_active = true
    AND (end_date IS NULL OR end_date > now())
  );

CREATE POLICY "Super admin and admin can manage featured listings"
  ON featured_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin and admin can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- SEED DEFAULT DATA
-- ============================================

-- Insert default countries
INSERT INTO countries (name, code) VALUES
  ('Somalia', 'SO'),
  ('Kenya', 'KE'),
  ('Ethiopia', 'ET'),
  ('Djibouti', 'DJ')
ON CONFLICT (code) DO NOTHING;

-- Insert default property types
INSERT INTO property_types (name, category) VALUES
  ('Apartment', 'rental'),
  ('House', 'rental'),
  ('Villa', 'rental'),
  ('Guesthouse', 'guesthouse'),
  ('Boutique Hotel', 'hotel'),
  ('Resort', 'hotel'),
  ('Residential Plot', 'sale'),
  ('Commercial Building', 'sale'),
  ('Apartment For Sale', 'sale')
ON CONFLICT (name) DO NOTHING;

-- Insert default amenities
INSERT INTO amenities (name, icon, category) VALUES
  ('WiFi', 'wifi', 'connectivity'),
  ('Air Conditioning', 'wind', 'comfort'),
  ('Parking', 'car', 'facilities'),
  ('Swimming Pool', 'waves', 'recreation'),
  ('Gym', 'dumbbell', 'fitness'),
  ('Kitchen', 'utensils', 'cooking'),
  ('Washer', 'washing-machine', 'laundry'),
  ('TV', 'tv', 'entertainment'),
  ('Pet Friendly', 'dog', 'policies'),
  ('Security', 'shield', 'safety')
ON CONFLICT (name) DO NOTHING;

-- Insert default payment methods
INSERT INTO payment_methods (name, type, provider) VALUES
  ('EVC Plus', 'mobile_money', 'Hormuud'),
  ('Zaad', 'mobile_money', 'Telesom'),
  ('Sahal', 'mobile_money', 'Somtel'),
  ('M-Pesa', 'mobile_money', 'Safaricom'),
  ('Credit/Debit Card', 'card', NULL),
  ('Bank Transfer', 'bank_transfer', NULL),
  ('Cash', 'cash', NULL)
ON CONFLICT (name) DO NOTHING;

-- Insert default commission settings
INSERT INTO commission_settings (listing_type, commission_percentage) VALUES
  ('rental', 10.0),
  ('hotel', 15.0),
  ('guesthouse', 12.0),
  ('sale', 5.0)
ON CONFLICT (listing_type) DO NOTHING;
