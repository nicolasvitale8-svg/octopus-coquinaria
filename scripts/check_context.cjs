
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkContext() {
    const userId = 'dc1e06af-002f-46ec-900c-c6bef40af35e';
    console.log(`🔍 Buscando negocios para el usuario: ${userId}`);

    // Check memberships
    const { data: memberships, error: memberError } = await supabase
        .from('business_memberships')
        .select('*, businesses(*)')
        .eq('user_id', userId);

    if (memberError) {
        console.error("Error memberships:", memberError);
    } else {
        console.log(`🏢 Negocios encontrados: ${memberships.length}`);
        memberships.forEach(m => {
            console.log(`- ${m.businesses.name} (ID: ${m.business_id})`);
        });
    }

    // Check transactions with business_id
    const { data: businessTransactions, error: tError } = await supabase
        .from('fin_transactions')
        .select('id, description, business_id')
        .not('business_id', 'is', null);

    if (tError) {
        console.error("Error transactions:", tError);
    } else {
        console.log(`📊 Transacciones de 'Empresa' detectadas: ${businessTransactions.length}`);
    }
}

checkContext();
