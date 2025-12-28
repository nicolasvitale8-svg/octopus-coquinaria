
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createDevUser() {
    console.log("Creando usuario admin@octopus.com...");

    const { data, error } = await supabase.auth.signUp({
        email: 'admin@octopus.com',
        password: 'adminpassword123', // Password simple para dev
        options: {
            data: {
                full_name: 'Super Admin',
                role: 'admin' // Esto se ignora por seguridad de Supabase, pero lo ponemos igual
            }
        }
    });

    if (error) {
        console.error("Error creando usuario:", error.message);
    } else {
        console.log("Usuario creado exitosamente!");
        console.log("ID:", data.user?.id);
        console.log("Email:", data.user?.email);
        console.log("Metadata:", data.user?.user_metadata);
    }
}

createDevUser();
