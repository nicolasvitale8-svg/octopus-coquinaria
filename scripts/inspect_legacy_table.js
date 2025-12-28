import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspect() {
    console.log("🕵️ Inspecting 'leads' table schema...");

    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Error fetching leads:", error.message);
        console.log("Try checking if RLS blocks read or table really exists.");
        if (error.code === '42P01') console.log("Table does not exist.");
    } else {
        if (data && data.length > 0) {
            console.log("✅ Found row. Columns:");
            console.log(Object.keys(data[0]).join(", "));
            console.log("Sample data:", data[0]);
        } else {
            console.log("⚠️ Table 'leads' is empty or no rows returned.");
        }
    }
}
inspect();
