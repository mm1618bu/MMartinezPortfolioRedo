/**
 * Simple test to verify Supabase connection
 * Run with: node test-connection.js
 */

const supabaseUrl = 'https://cexhfbreotogzlhisfxd.supabase.co';
const supabaseKey = 'sb_publishable_c1q20_xzXDK2Nwk9v2HwAA_X2wppVn-';

console.log('Testing Supabase connectivity...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

// Test with correct header
const testConnection = async () => {
  try {
    const response = await fetch(supabaseUrl + '/rest/v1/', {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('✓ Network connectivity test passed');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('  Response:', text.substring(0, 200));
    
    // Test actual database query
    console.log('\nTesting database query...');
    const queryResponse = await fetch(supabaseUrl + '/rest/v1/sites?limit=1', {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('  Query Status:', queryResponse.status);
    const queryText = await queryResponse.text();
    console.log('  Query Response:', queryText.substring(0, 200));
    
  } catch (err) {
    console.error('\n✗ Test failed');
    console.error('  Error:', err.message);
  }
};

testConnection();
