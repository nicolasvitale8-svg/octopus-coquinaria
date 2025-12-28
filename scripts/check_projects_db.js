
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkProjects() {
    console.log("Checking Supabase Connection...");
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, business_name, created_at');

    if (error) {
        console.error("Error fetching projects:", error);
    } else {
        console.log(`Found ${projects.length} projects in Supabase CLOUD:`);
        projects.forEach(p => console.log(`- ${p.business_name} (${p.id})`));
    }
}

checkProjects();
