
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugLogin() {
    console.log("Probando login con admin@octopus.com...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@octopus.com',
        password: 'admin123',
    });

    if (error) {
        console.error("❌ Error raw:", JSON.stringify(error, null, 2));
        console.error("Mensaje:", error.message);
    } else {
        console.log("✅ Login exitoso!", data.user);
    }
}

debugLogin();
