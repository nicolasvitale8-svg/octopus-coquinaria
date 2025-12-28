
import { createClient } from '@supabase/supabase-js';

// Hardcoded keys from constants.ts / fix_admin_permissions.ts
const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProjects() {
    console.log("--- DEBUGGING PROJECTS ---");

    // 1. Try fetching as Anonymous (should fail or return 0 if RLS is on)
    console.log("\n1. Fetching as Anonymous...");
    const { data: anonData, error: anonError } = await supabase
        .from('projects')
        .select('id, business_name, phase')
        .limit(5);

    if (anonError) console.log("   [Anon] Error:", anonError.message);
    else console.log(`   [Anon] Found: ${anonData.length} projects.`);

    // 2. Login as 'admin@octopus.com' (Test Admin)
    console.log("\n2. Logging in as 'admin@octopus.com'...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@octopus.com',
        password: 'admin123',
    });

    if (authError) {
        console.error("   ❌ Login Failed:", authError.message);
        return;
    }
    console.log("   ✅ Login OK.");

    // 3. Try fetching as Admin
    console.log("\n3. Fetching as Admin...");
    const { data: adminData, error: adminError } = await supabase
        .from('projects')
        .select('*');

    if (adminError) {
        console.error("   ❌ [Admin] Error:", adminError.message);
    } else {
        console.log(`   ✅ [Admin] Found: ${adminData.length} projects.`);
        if (adminData.length > 0) {
            console.table(adminData.map(p => ({
                id: p.id,
                name: p.business_name,
                phase: p.phase
            })));
        } else {
            console.log("   ⚠️ Table is empty.");
        }
    }
}

checkProjects();
