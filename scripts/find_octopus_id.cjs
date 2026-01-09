
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findOctopusBusiness() {
    console.log("🔍 Buscando negocio 'Octopus'...");

    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("🏢 Negocios registrados:");
    businesses.forEach(b => {
        console.log(`- ${b.name} (ID: ${b.id})`);
    });

    const octopus = businesses.find(b => b.name.toLowerCase().includes('octopus'));
    if (octopus) {
        console.log(`✅ ID de Octopus encontrado: ${octopus.id}`);
    } else {
        console.log("⚠️ No se encontró un negocio con el nombre 'Octopus'.");
    }
}

findOctopusBusiness();
