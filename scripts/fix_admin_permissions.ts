
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhteXp1dXVqeXVydnl1dXN2eXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDUyMjgsImV4cCI6MjA4MDI4MTIyOH0.PSXTNZoGg2alqdtlGuluWsvMbu2dnGIJuxjdGPCTWrQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixPermissions() {
    console.log("1. Iniciando sesión como Admin...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@octopus.com',
        password: 'admin123',
    });

    if (authError) {
        console.error("❌ Error Login:", authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log("✅ Login OK. ID:", userId);

    console.log("2. Verificando/Creando perfil de Admin en tabla 'usuarios'...");

    // Upsert para asegurar que tenga rol de admin
    const { error: upsertError } = await supabase
        .from('usuarios')
        .upsert({
            id: userId,
            email: 'admin@octopus.com',
            full_name: 'Super Admin',
            role: 'admin'
        });

    if (upsertError) {
        console.error("❌ Error actualizando permisos:", upsertError.message);
        console.error("   (Es probable que RLS te impida editar tu propio rol si no eres ya admin en la DB).");
    } else {
        console.log("✅ Permisos de Admin actualizados en BDD.");
    }

    console.log("3. Probando lectura de Leads...");
    const { data: leads, error: leadsError } = await supabase
        .from('diagnosticos_express')
        .select('business_name')
        .limit(5);

    if (leadsError) {
        console.error("❌ Error leyendo leads:", leadsError.message);
    } else {
        console.log(`✅ ÉXITO. Se encontraron ${leads?.length || 0} leads.`);
        if (leads?.length === 0) console.log("   (La tabla está vacía o RLS sigue bloqueando).");
        else console.table(leads);
    }
}

fixPermissions();
