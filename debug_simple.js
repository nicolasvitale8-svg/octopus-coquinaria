
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    try {
        const { error: loginError } = await supabase.auth.signInWithPassword({
            email: 'admin@octopus.com',
            password: 'admin123',
        });

        if (loginError) {
            console.log("LOGIN_ERROR: " + loginError.message);
            return;
        }

        const { data, error } = await supabase.from('projects').select('*').limit(3);

        if (error) {
            console.log("FETCH_ERROR: " + error.message);
        } else {
            console.log("PROJECTS_COUNT: " + data.length);
            if (data.length > 0) console.log("FIRST_ID: " + data[0].id);
        }
    } catch (e) {
        console.log("CRASH: " + e.message);
    }
}

run();
