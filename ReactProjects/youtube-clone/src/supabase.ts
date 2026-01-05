import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://ruwkbhmdfbuapnqeajci.supabase.co";
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1d2tiaG1kZmJ1YXBucWVhamNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDUwNjgsImV4cCI6MjA4MDAyMTA2OH0.8SClPTdqGIN26Td1AehEnBqwTiy8jxxiavEbZoKFjHU";

console.log("🔧 Supabase Config:", {
    url: supabaseUrl,
    keyLength: supabaseKey.length,
    hasEnvUrl: !!process.env.REACT_APP_SUPABASE_URL,
    hasEnvKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY
});

export const supabase = createClient(supabaseUrl, supabaseKey);
