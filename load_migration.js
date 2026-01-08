
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const sql = fs.readFileSync('database/migration_history.sql', 'utf8');
    const lines = sql.split('\n').filter(line => line.trim().startsWith('INSERT INTO'));

    console.log(`Cargando ${lines.length} registros...`);

    for (const line of lines) {
        // Very basic parser for these specific INSERT statements
        const tableMatch = line.match(/public\.(fin_\w+)/);
        if (!tableMatch) continue;
        const table = tableMatch[1];

        // Extract columns and values
        const colsMatch = line.match(/\((.*?)\)/);
        const valsMatch = line.match(/VALUES \((.*?)\)/);

        if (!colsMatch || !valsMatch) continue;

        const cols = colsMatch[1].split(',').map(c => c.trim());
        const rawVals = valsMatch[1].split(/,(?=(?:(?:[^']*'){2})*[^']*$)/).map(v => v.trim());

        const obj = {};
        cols.forEach((col, i) => {
            let val = rawVals[i];
            if (val === 'NULL') {
                val = null;
            } else if (val.startsWith("'") && val.endsWith("'")) {
                val = val.substring(1, val.length - 1);
            } else if (!isNaN(val)) {
                val = Number(val);
            }
            obj[col] = val;
        });

        const { error } = await supabase.from(table).upsert(obj, { onConflict: 'id' });
        if (error) {
            console.error(`Error en tabla ${table}:`, error.message);
        }
    }
    console.log('Carga finalizada.');
}

run();
