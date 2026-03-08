/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// --- V3 SECURITY FIX: Strict Environment Variables Handling ---
// Supabase constants now purely resolve to process.env.VITE_SUPABASE...
// We handle fallbacks specifically for local dev vs production build here safely.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 [SECURITY] Supabase credentials missing! Please configure .env or Vercel Environment Variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
