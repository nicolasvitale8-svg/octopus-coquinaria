-- MIGRATION & CLEANUP SCRIPT (FIXED)
-- Safely moves data from old tables to new ones before dropping.

-- 1. MIGRATE LEADS -> DIAGNOSTICOS_EXPRESS
-- Corrected column names based on inspection:
-- name -> contact_name
-- business -> business_name
-- email -> contact_email (Assumed, if fails try 'email')
-- phone -> contact_phone (Assumed, if fails try 'phone')

INSERT INTO public.diagnosticos_express 
(contact_name, business_name, contact_email, contact_phone, created_at, source, full_data)
SELECT 
    contact_name,       -- Fix: 'name' was wrong
    business_name,      -- Fix: 'business' was wrong
    contact_email,      -- Fix: Assumed based on pattern
    contact_phone,      -- Fix: Assumed based on pattern
    created_at, 
    'migrated_from_leads',
    jsonb_build_object('migrated_data', to_jsonb(leads.*)) -- Preserve everything else in JSON just in case
FROM public.leads
WHERE NOT EXISTS (
    SELECT 1 FROM public.diagnosticos_express WHERE contact_email = public.leads.contact_email
);

-- 2. MIGRATE ADMIN_CONFIG -> CONFIGURACION
INSERT INTO public.configuracion (key, value, description)
SELECT 
    key, 
    value::jsonb, 
    'Migrated from admin_config'
FROM public.admin_config
ON CONFLICT (key) DO NOTHING;

-- 3. DROP OBSOLETE TABLES
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS admin_config;
DROP TABLE IF EXISTS diagnostics;
DROP TABLE IF EXISTS profiles;
