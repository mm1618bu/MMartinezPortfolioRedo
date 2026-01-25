/**
 * Database Connection Troubleshooting Guide
 * Run these commands in browser console (F12 → Console)
 */

// =============================================
// STEP 1: Check Environment Variables
// =============================================
console.log('=== CHECKING ENVIRONMENT VARIABLES ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

// =============================================
// STEP 2: Check Supabase Client
// =============================================
console.log('\n=== CHECKING SUPABASE CLIENT ===');
console.log('Supabase imported:', typeof supabase !== 'undefined' ? '✓ Yes' : '✗ No');

// =============================================
// STEP 3: Test Connection to Each Table
// =============================================
console.log('\n=== TESTING TABLE CONNECTIONS ===');

const tables = ['organizations', 'sites', 'departments', 'employees', 'shift_templates', 'labor_standards', 'demands'];

async function testAllTables() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`✓ ${table}: Connected (${data.length} row(s))`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

// Run the test
await testAllTables();

// =============================================
// STEP 4: Get Detailed Error Info
// =============================================
console.log('\n=== IF YOU SEE ERRORS ABOVE ===');
console.log('Common causes:');
console.log('1. "does not exist" → Run COMPLETE_DATABASE_SCHEMA.sql in Supabase');
console.log('2. "infinite recursion" → Disable RLS policies temporarily');
console.log('3. "Unauthorized" → Check API key in .env');
console.log('4. "CORS" → Add localhost:5173 to Supabase CORS settings');
