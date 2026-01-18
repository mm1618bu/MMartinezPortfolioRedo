import { createClient } from '@supabase/supabase-js';
import config from '../config';

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Supabase URL and Anon Key must be provided');
}

export const supabase = createClient(config.supabase.url, config.supabase.anonKey);
