import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    console.log("TEST: Attempting UPSERT...");
    const id = "11111111-1111-1111-1111-111111111111"; // Fixed ID to force upsert logic
    const { data, error } = await supabase.from('projects').upsert([
        { id: id, business_name: 'TEST_UPSERT_' + Date.now(), status: 'verde' }
    ]).select();

    if (error) {
        console.error("FAIL: " + error.message);
    } else {
        console.log("SUCCESS: Upserted ID " + (data[0]?.id || "unknown"));
    }
}
run();
