/*
  # Enhance Bookings and Listings for Super Admin Dashboard

  1. New Columns
    - Add booking_type to bookings (property/hotel/guesthouse)
    - Add listing_id reference to bookings
    - Add room_id reference to bookings
    - Add payment fields to bookings
    - Add commission fields to payments
    - Add location fields to hotels and guesthouses

  2. Indexes
    - Add performance indexes for common queries

  3. Notes
    - All changes use IF NOT EXISTS pattern
    - No data loss or breaking changes
*/

-- Add booking_type to categorize bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE bookings ADD COLUMN booking_type text DEFAULT 'property'
      CHECK (booking_type IN ('property', 'hotel', 'guesthouse'));
  END IF;
END $$;

-- Add listing_id reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'listing_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN listing_id uuid REFERENCES listings(id);
  END IF;
END $$;

-- Add room_id reference
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN room_id uuid REFERENCES rooms(id);
  END IF;
END $$;

-- Add payment_method to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_method text;
  END IF;
END $$;

-- Add payment_status to bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_status text DEFAULT 'unpaid'
      CHECK (payment_status IN ('unpaid', 'paid', 'partially_paid', 'refunded'));
  END IF;
END $$;

-- Add commission to payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'commission_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN commission_amount numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'commission_percentage'
  ) THEN
    ALTER TABLE payments ADD COLUMN commission_percentage numeric DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'host_payout'
  ) THEN
    ALTER TABLE payments ADD COLUMN host_payout numeric DEFAULT 0;
  END IF;
END $$;

-- Add is_featured to listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE listings ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Add location fields to hotels
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'country_id'
  ) THEN
    ALTER TABLE hotels ADD COLUMN country_id uuid REFERENCES countries(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE hotels ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hotels' AND column_name = 'area_id'
  ) THEN
    ALTER TABLE hotels ADD COLUMN area_id uuid REFERENCES areas(id);
  END IF;
END $$;

-- Add location fields to guesthouses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guesthouses' AND column_name = 'country_id'
  ) THEN
    ALTER TABLE guesthouses ADD COLUMN country_id uuid REFERENCES countries(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guesthouses' AND column_name = 'city_id'
  ) THEN
    ALTER TABLE guesthouses ADD COLUMN city_id uuid REFERENCES cities(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guesthouses' AND column_name = 'area_id'
  ) THEN
    ALTER TABLE guesthouses ADD COLUMN area_id uuid REFERENCES areas(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_listing_type ON listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_listings_is_featured ON listings(is_featured);

CREATE INDEX IF NOT EXISTS idx_property_sales_status ON property_sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_inquiries_status ON sales_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);