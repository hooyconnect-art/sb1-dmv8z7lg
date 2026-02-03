/*
  # Fix Guesthouse Property Category Constraint
  
  1. Changes
    - Update `guesthouses.property_type` constraint to include all valid categories
    - Add support for residential: apartment, house, villa, guesthouse
    - Add support for commercial: office, commercial
    - Ensures form submission works for all property categories
    
  2. Why
    - Current constraint only allows: house, apartment, villa, guesthouse
    - Form offers: apartment, villa, office, commercial
    - Mismatch causes "office" and "commercial" submissions to fail
    - Rental properties need to support both residential and commercial
*/

-- Drop existing constraint
ALTER TABLE guesthouses 
DROP CONSTRAINT IF EXISTS guesthouses_property_type_check;

-- Add new constraint with all valid categories
ALTER TABLE guesthouses 
ADD CONSTRAINT guesthouses_property_type_check 
CHECK (property_type IN ('apartment', 'house', 'villa', 'guesthouse', 'office', 'commercial'));
