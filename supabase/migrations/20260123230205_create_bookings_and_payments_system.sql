/*
  # Create Bookings and Payments System

  ## Overview
  Creates complete booking and payment tracking system for HoyConnect accommodations.

  ## New Tables
  - `bookings` - Guest bookings for hotels and guesthouses
  - `property_sales` - Properties listed for sale
  - `sales_inquiries` - Buyer inquiries for property sales
  - `commission_settings` - Platform commission rates by listing type

  ## Security
  - Enable RLS on all tables
  - Guests can view/create their own bookings
  - Hosts can view bookings for their properties
  - Admins can view/manage everything

  ## Important Notes
  - Bookings link to listings (hotels/guesthouses)
  - Payments link to bookings
  - Commission settings control platform revenue
*/

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  property_id uuid,
  booking_type text NOT NULL DEFAULT 'listing' CHECK (booking_type IN ('listing', 'property')),
  check_in timestamptz NOT NULL,
  check_out timestamptz NOT NULL,
  num_guests integer NOT NULL DEFAULT 1 CHECK (num_guests > 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method text CHECK (payment_method IN ('card', 'cash', 'bank_transfer', 'mobile_money')),
  special_requests text,
  cancellation_reason text,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_sales table
CREATE TABLE IF NOT EXISTS property_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('land', 'house', 'apartment', 'commercial', 'villa', 'farm')),
  price decimal(12,2) NOT NULL CHECK (price >= 0),
  size_sqm decimal(10,2),
  bedrooms integer,
  bathrooms integer,
  city text NOT NULL,
  address text NOT NULL,
  features text[],
  images text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'withdrawn')),
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales_inquiries table  
CREATE TABLE IF NOT EXISTS sales_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_sale_id uuid NOT NULL REFERENCES property_sales(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL,
  buyer_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'closed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commission_settings table
CREATE TABLE IF NOT EXISTS commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_type text NOT NULL UNIQUE CHECK (listing_type IN ('hotel', 'guesthouse', 'furnished', 'rental')),
  commission_percentage decimal(5,2) NOT NULL DEFAULT 10.0 CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_property_sales_seller_id ON property_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_property_sales_status ON property_sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_property_sale_id ON sales_inquiries(property_sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_status ON sales_inquiries(status);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Guests can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (guest_id = auth.uid());

CREATE POLICY "Guests can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Guests can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (guest_id = auth.uid())
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for property_sales
CREATE POLICY "Anyone can view active property sales"
  ON property_sales FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can view own properties"
  ON property_sales FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can create property sales"
  ON property_sales FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own properties"
  ON property_sales FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can manage all property sales"
  ON property_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for sales_inquiries
CREATE POLICY "Anyone can create inquiries"
  ON sales_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Property sellers can view inquiries"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_sales
      WHERE id = sales_inquiries.property_sale_id
        AND seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all inquiries"
  ON sales_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update inquiries"
  ON sales_inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for commission_settings
CREATE POLICY "Anyone can view commission settings"
  ON commission_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage commission settings"
  ON commission_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default commission settings
INSERT INTO commission_settings (listing_type, commission_percentage, description)
VALUES 
  ('hotel', 15.0, 'Commission rate for hotel bookings'),
  ('guesthouse', 12.0, 'Commission rate for guesthouse bookings'),
  ('furnished', 10.0, 'Commission rate for furnished rentals'),
  ('rental', 10.0, 'Commission rate for long-term rentals')
ON CONFLICT (listing_type) DO NOTHING;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_property_sales_updated_at ON property_sales;
CREATE TRIGGER update_property_sales_updated_at
  BEFORE UPDATE ON property_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_inquiries_updated_at ON sales_inquiries;
CREATE TRIGGER update_sales_inquiries_updated_at
  BEFORE UPDATE ON sales_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_commission_settings_updated_at ON commission_settings;
CREATE TRIGGER update_commission_settings_updated_at
  BEFORE UPDATE ON commission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
