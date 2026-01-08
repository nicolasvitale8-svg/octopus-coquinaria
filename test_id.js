
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hmyzuuujyurvyuusvyzp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
    // We try to list users from public.usuarios since it's likely synced and readable with anon key
    // if RLS allows it (or if it's the admin user)
    const { data, error } = await supabase.from('usuarios').select('id, email').eq('email', 'nicolasvitale8@gmail.com');

    if (error) {
        console.error('ERROR:', error.message);
        // Fallback: list all users to see what's there
        const { data: allUsers, error: err2 } = await supabase.from('usuarios').select('id, email');
        if (err2) {
            console.error('ERROR LISTING ALL:', err2.message);
        } else {
            console.log('ALL_USERS:', JSON.stringify(allUsers));
        }
    } else {
        console.log('USERS_FOUND:', JSON.stringify(data));
    }
}

check();
