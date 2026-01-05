// Quick test script to check Supabase connection and data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ruwkbhmdfbuapnqeajci.supabase.co';
const supabaseKey = 'sb_publishable_cd7IhMPPXUXr5jJX_84Y1g_o26vPGzV';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🧪 Testing Supabase connection...\n');
    
    try {
        // Test 1: Try to fetch videos
        console.log('📹 Checking videos table...');
        const { data: videos, error: videoError, count } = await supabase
            .from('videos')
            .select('*', { count: 'exact' })
            .limit(5);
        
        if (videoError) {
            console.error('❌ Error fetching videos:', videoError.message);
        } else {
            console.log(`✅ Videos table accessible`);
            console.log(`   Total videos: ${count || 0}`);
            if (videos && videos.length > 0) {
                console.log(`   Sample video: "${videos[0].title}"`);
            } else {
                console.log('   ⚠️  No videos found in database!');
            }
        }
        
        // Test 2: Check auth
        console.log('\n🔐 Checking auth...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError && authError.message !== 'Auth session missing!') {
            console.error('❌ Auth error:', authError.message);
        } else {
            console.log('✅ Auth system accessible');
            console.log(`   User: ${user ? user.email : 'Not logged in'}`);
        }
        
    } catch (err) {
        console.error('❌ Connection test failed:', err.message);
    }
}

testConnection();
