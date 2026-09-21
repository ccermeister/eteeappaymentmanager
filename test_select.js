import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSelect() {
  console.log("Trying to select from profile_ledger as anon...");
  const { data, error } = await supabase.from('profile_ledger').select('*');
  
  if (error) {
    console.log("Select Error:", error);
  } else {
    console.log(`Select Success: Found ${data.length} rows.`);
    console.log(data);
  }
}

testSelect();
