// DEPRECATED: Use getSupabaseBrowserClient() directly instead
// This file is kept for backwards compatibility only
import { getSupabaseBrowserClient } from './supabase-client'

// Always use the SSR-compatible browser client
// This ensures cookies are properly set for middleware
export const supabase = getSupabaseBrowserClient()

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'guest' | 'host' | 'admin' | 'super_admin';
  avatar_url: string | null;
  verified: boolean;
  is_verified?: boolean; // Alias for backwards compatibility
  status: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  property_type: 'apartment' | 'hotel' | 'house' | 'villa';
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  price_per_night: number;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  special_requests: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  property_id: string;
  guest_id: string;
  booking_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type HostRequest = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  property_type: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
};
