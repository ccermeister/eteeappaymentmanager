import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const isDev = import.meta.env.DEV;
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);
