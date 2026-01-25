import { createClient } from '@supabase/supabase-js';
import config from '../config';

const url = config.supabase.url || process.env.SUPABASE_URL;
const key = config.supabase.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase config. URL:', !!url, 'KEY:', !!key);
  throw new Error('Supabase URL and Service Role Key must be provided in .env');
}

// Use service role key for backend (admin access that bypasses RLS)
export const supabase = createClient(url, key);
