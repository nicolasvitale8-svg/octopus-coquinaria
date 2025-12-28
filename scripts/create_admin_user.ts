
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
    console.log("Intentando crear usuario admin@octopus.com...");
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@octopus.com',
        password: 'admin123',
    });

    if (error) {
        console.error("Error creating user (auth):", error.message);
    } else {
        console.log("Usuario de AUTH creado/existente:", data.user?.email);
        const userId = data.user?.id;

        if (userId) {
            console.log("Intentando inyectar rol de ADMIN en tabla 'usuarios'...");
            const { error: dbError } = await supabase
                .from('usuarios')
                .upsert({
                    id: userId,
                    email: 'admin@octopus.com',
                    full_name: 'Super Admin',
                    role: 'admin'
                });

            if (dbError) console.error("Error BD:", dbError.message);
            else console.log("✅ Rol de ADMIN inyectado con éxito en la base de datos.");
        }
    }
}

createAdmin();
