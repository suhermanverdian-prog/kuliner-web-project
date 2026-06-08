// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url-please-set-env.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-please-set-env';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
