import { createClient } from "@supabase/supabase-js";

const supabaseUrl = `${window.location.origin}/supabase`; // Full URL required by supabase-js validation
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: (...args) => fetch(...args)
  }
});