/*
  # Fix Commission Function Column Reference

  ## Issue
  - Function uses 'rate' but column is named 'commission_rate'

  ## Fix
  - Update calculate_booking_commission to use correct column name
*/

CREATE OR REPLACE FUNCTION calculate_booking_commission(
  p_property_type text,
  p_total_price numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_commission_rate numeric;
  v_commission_amount numeric;
BEGIN
  -- Get commission rate for property type
  SELECT commission_rate INTO v_commission_rate
  FROM commission_settings
  WHERE property_type = p_property_type
    AND is_active = true
  LIMIT 1;

  -- If no rate found, return 0
  IF v_commission_rate IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate commission
  v_commission_amount := p_total_price * (v_commission_rate / 100);

  RETURN v_commission_amount;
END;
$$;

CREATE OR REPLACE FUNCTION get_commission_analytics(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  property_type text,
  total_bookings bigint,
  total_revenue numeric,
  total_commission numeric,
  avg_commission_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.property_type,
    COUNT(b.id) as total_bookings,
    SUM(b.total_price) as total_revenue,
    SUM(b.commission_amount) as total_commission,
    AVG(cs.commission_rate) as avg_commission_rate
  FROM bookings b
  LEFT JOIN commission_settings cs ON cs.property_type = b.property_type
  WHERE 
    (p_start_date IS NULL OR b.created_at >= p_start_date)
    AND (p_end_date IS NULL OR b.created_at <= p_end_date)
    AND b.status = 'confirmed'
  GROUP BY b.property_type;
END;
$$;
