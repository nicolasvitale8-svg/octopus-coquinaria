
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function findDuplicates() {
    console.log("🔍 Buscando duplicados en fin_transactions...");

    const { data: transactions, error } = await supabase
        .from('fin_transactions')
        .select('*')
        .eq('user_id', 'dc1e06af-002f-46ec-900c-c6bef40af35e');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const seenCount = {};
    const duplicates = [];

    transactions.forEach(t => {
        const key = `${t.date}-${t.description}-${t.amount}-${t.type}-${t.account_id}`;
        if (seenCount[key]) {
            duplicates.push(t.id);
            seenCount[key]++;
        } else {
            seenCount[key] = 1;
        }
    });

    console.log(`📊 Total transacciones: ${transactions.length}`);
    console.log(`🚨 Duplicados encontrados: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log("IDs de duplicados (primeros 5):", duplicates.slice(0, 5));

        // Count entries for a specific duplicate to verify
        const firstDup = transactions.find(t => t.id === duplicates[0]);
        const matching = transactions.filter(t =>
            t.date === firstDup.date &&
            t.description === firstDup.description &&
            t.amount === firstDup.amount
        );
        console.log(`🔍 Ejemplo: "${firstDup.description}" aparece ${matching.length} veces.`);
    }
}

findDuplicates();
