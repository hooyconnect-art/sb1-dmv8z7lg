import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, isConfigured } from './supabase-config';

export function getSupabaseAdmin() {
  const supabaseUrl = SUPABASE_CONFIG.SUPABASE_URL;
  const serviceRoleKey = SUPABASE_CONFIG.SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!isConfigured()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured. Please add it in lib/supabase-config.ts. Get it from: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
