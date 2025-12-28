
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Intenta leer variables de entorno locales o usa las hardcodeadas si es necesario (PRECAUCIÓN CON KEYS)
// Nota: En este entorno de script node, process.env debería tener lo que tenga el .env
// Si no, el usuario deberá asegurarse de tener .env configurado.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'PEGAR_URL_SI_FALLA';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'PEGAR_KEY_SI_FALLA';

if (!SUPABASE_URL || SUPABASE_URL.includes('PEGAR')) {
    console.error("❌ No se encontraron las variables de entorno VITE_SUPABASE_URL / ANON_KEY.");
    console.log("Asegúrate de tener un archivo .env con estas variables o edita este script.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkCloudData() {
    console.log("📡 Conectando a Supabase (NUBE)...");
    console.log(`URL: ${SUPABASE_URL}`);

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, business_name, status, created_at');

    if (error) {
        console.error("❌ Error al leer Supabase:", error.message);
        return;
    }

    if (!projects || projects.length === 0) {
        console.warn("⚠️  Conexión exitosa, pero NO HAY PROYECTOS en la nube.");
        console.log("   Esto significa que tus datos están SOLO en tu computadora (Local).");
    } else {
        console.log(`✅  Se encontraron ${projects.length} proyectos en la NUBE:`);
        projects.forEach(p => {
            console.log(`   - [${p.status}] ${p.business_name} (ID: ${p.id})`);
        });
        console.log("\n   ¡Tus datos están respaldados!");
    }
}

checkCloudData();
