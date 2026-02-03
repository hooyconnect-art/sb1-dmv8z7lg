import { createClient } from '@supabase/supabase-js';

export function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error('SUPABASE_URL is missing');
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey || serviceRoleKey === 'your_service_role_key_here') {
    console.error('SERVICE_ROLE_KEY is not configured. Current value:', serviceRoleKey ? 'SET BUT INVALID' : 'NOT SET');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured properly');
  }

  console.log('✓ Creating Supabase admin client with service role key (length:', serviceRoleKey.length, ')');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function isServerConfigured(): boolean {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!serviceRoleKey &&
         serviceRoleKey !== 'your_service_role_key_here' &&
         serviceRoleKey.length > 20;
}
