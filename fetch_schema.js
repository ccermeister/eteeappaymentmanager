import fs from 'fs';

async function fetchSchema() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  console.log("Fetching OpenAPI spec from Supabase...");
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  
  if (!response.ok) {
    console.error("Failed to fetch schema:", response.statusText);
    return;
  }
  
  const schema = await response.json();
  const definitions = schema.definitions || schema.components?.schemas;
  
  if (!definitions) {
    console.log("No definitions found in the OpenAPI spec.");
    return;
  }
  
  const tablesToCheck = ['profile_ledger', 'payables', 'transaction_records', 'edit_requests', 'audit_logs', 'ledger_state'];
  
  for (const table of tablesToCheck) {
    const tableDef = definitions[table];
    if (tableDef) {
      console.log(`\n=== Table: ${table} ===`);
      const props = tableDef.properties;
      if (props) {
        for (const [colName, colDef] of Object.entries(props)) {
          console.log(` - ${colName}: ${colDef.type} ${colDef.format ? '(' + colDef.format + ')' : ''}`);
        }
      } else {
        console.log(" No properties found.");
      }
    } else {
      console.log(`\n=== Table: ${table} (NOT FOUND IN SCHEMA) ===`);
    }
  }
}

fetchSchema();
