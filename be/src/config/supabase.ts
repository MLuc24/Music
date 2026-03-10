import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Use service role key for backend operations (bypasses RLS)
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);
