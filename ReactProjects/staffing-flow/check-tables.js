/**
 * Check actual tables in database using Supabase JS client
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cexhfbreotogzlhisfxd.supabase.co';
const supabaseKey = 'sb_publishable_c1q20_xzXDK2Nwk9v2HwAA_X2wppVn-';

const client = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'sites',
  'organizations',
  'departments',
  'employees',
  'shift_templates',
  'labor_standards',
  'demands',
];

console.log('Checking tables in Supabase database...\n');

async function checkTable(tableName) {
  try {
    const { data, error, status } = await client
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.log(`✗ ${tableName}: ${error.message} (Status: ${status})`);
      return false;
    } else {
      console.log(`✓ ${tableName}: Table exists (${data?.length || 0} rows returned)`);
      return true;
    }
  } catch (err) {
    console.log(`✗ ${tableName}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

async function main() {
  const results = await Promise.all(tablesToCheck.map(checkTable));
  const existingTables = tablesToCheck.filter((_, i) => results[i]);
  
  console.log('\n=== SUMMARY ===');
  console.log(`Tables found: ${existingTables.length}/${tablesToCheck.length}`);
  console.log('Tables:', existingTables.length > 0 ? existingTables.join(', ') : 'None');
}

main();
