import { createClient } from '@supabase/supabase-js';
import config from '../config';

const url = config.supabase.url || process.env.SUPABASE_URL || 'https://cexhfbreotogzlhisfxd.supabase.co';
const key = config.supabase.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNleGhmYnJlb3RvZ3psaGlzZnhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY5MTA1MCwiZXhwIjoyMDg0MjY3MDUwfQ.jcqZBwODQlmMxX92CyELZwAA4XpT-TGx1F1rKw9iUwk';

if (!url || !key) {
  console.error('Missing Supabase config. URL:', !!url, 'KEY:', !!key);
  throw new Error('Supabase URL and Service Role Key must be provided in .env');
}

console.log('Supabase initialized with URL:', url);

// Use service role key for backend (admin access that bypasses RLS)
export const supabase = createClient(url, key);
