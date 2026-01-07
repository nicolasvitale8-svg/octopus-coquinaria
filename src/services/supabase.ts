/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
