/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;

// --- EMERGENCY FIX: Prioritize constants if they have the new sb_publishable format ---
const supabaseAnonKey = SUPABASE_ANON_KEY.startsWith('sb_')
  ? SUPABASE_ANON_KEY
  : (import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
