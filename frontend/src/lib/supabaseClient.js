// supabaseClient.js – initialize Supabase client for the frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url-please-set-env.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-please-set-env';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exported for use in other modules
export default supabase;
