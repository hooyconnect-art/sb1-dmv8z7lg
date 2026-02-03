// SIMPLE SETUP: Add your Supabase service role key here
// Get it from: https://supabase.com/dashboard/project/szdnbrxfwckxceeywewh/settings/api

export const SUPABASE_CONFIG = {
  // Automatically reads from .env file
  SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here',

  // These are already configured (don't change)
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Helper to check if config is valid
export function isConfigured(): boolean {
  return SUPABASE_CONFIG.SERVICE_ROLE_KEY !== 'your_service_role_key_here'
    && SUPABASE_CONFIG.SERVICE_ROLE_KEY.length > 20;
}
