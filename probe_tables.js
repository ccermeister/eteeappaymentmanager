import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEndpoints() {
  const tables = [
    'profile_ledger',
    'payables',
    'ledger_state',
    'transaction_records',
    'edit_requests',
    'audit_logs'
  ];
  
  for (const table of tables) {
    console.log(`\n--- Fetching schema for ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.log(`Error on ${table}:`, error.message);
    } else {
      if (data && data.length > 0) {
        console.log(`Keys for ${table}:`, Object.keys(data[0]));
      } else {
        console.log(`${table} exists but is empty.`);
        // Try an OPTIONS request to get schema using fetch
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
            method: 'OPTIONS',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`
            }
          });
          const text = await res.text();
          console.log(`OPTIONS for ${table}:`, text.substring(0, 100) + '...');
        } catch (e) {
           console.log(`OPTIONS failed for ${table}`);
        }
      }
    }
  }
}

testEndpoints();
