import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Server-side Supabase client using the service role key so Row Level
 * Security does not block trusted backend operations.
 * NEVER expose the service role key to clients.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
