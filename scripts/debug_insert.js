
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInsert() {
    console.log("Attempting test insert...");

    const { data, error } = await supabase.from('projects').insert([{
        business_name: 'TEST_SYNC_DIAGNOSIS',
        status: 'amarillo',
        phase: 'Lead'
    }]).select();

    if (error) {
        console.error("❌ Insert FAILED:", error.message);
        console.error("Details:", error);
    } else {
        console.log("✅ Insert SUCCEEDED:", data);
        // Clean up
        await supabase.from('projects').delete().eq('business_name', 'TEST_SYNC_DIAGNOSIS');
    }
}

testInsert();
