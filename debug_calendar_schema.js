import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectCalendar() {
    console.log("🔍 Fetching 1 event from public.eventos_calendario...");
    const { data, error } = await supabase
        .from('eventos_calendario')
        .select('*')
        .limit(1);

    if (error) {
        console.error("❌ Error fetching:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("⚠️ No events found in table.");
        return;
    }

    const event = data[0];
    console.log("✅ Event found!");
    console.log("Keys:", Object.keys(event));
    console.log("Sample:", JSON.stringify(event, null, 2));
}

inspectCalendar();
