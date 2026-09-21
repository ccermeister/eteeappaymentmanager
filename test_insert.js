import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log("Trying to insert into profile_ledger...");
  const { data, error } = await supabase.from('profile_ledger').insert({
    name: 'Test Student',
    course: 'BSCS',
    contact_number: '123456789'
  }).select();
  
  if (error) {
    console.log("Insert Error:", error);
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
