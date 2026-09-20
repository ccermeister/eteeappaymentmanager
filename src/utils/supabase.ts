import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.DEV ? `${window.location.origin}/supabase-api` : (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
