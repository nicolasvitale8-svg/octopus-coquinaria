
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findCerdo() {
    console.log("🔍 Buscando 'Cerdo Va!' en la base de datos...");

    // Login temporal
    await supabase.auth.signInWithPassword({
        email: 'admin@octopus.com',
        password: 'admin123',
    });

    const { data, error } = await supabase
        .from('projects')
        .select('id, business_name, created_at')
        .ilike('business_name', '%cerdo%'); // Case insensitive search

    if (error) {
        console.error("❌ Error buscando:", error.message);
    } else {
        if (data && data.length > 0) {
            console.log("✅ ¡ENCONTRADO!");
            console.table(data);
        } else {
            console.log("⚠️ No se encontró ningún proyecto que contenga 'cerdo' en el nombre.");
            console.log("   Esto significa que probablemente estaba solo en la memoria de tu navegador (LocalStorage)");
            console.log("   y no llegó a guardarse en la nube.");
        }
    }
}

findCerdo();
