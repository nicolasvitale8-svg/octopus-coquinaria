-- CLEANUP CONFIG TABLE
-- Removes redundant legacy English keys migrated from 'admin_config'.
-- The app uses Spanish keys defined in 'database_setup.sql'.

DELETE FROM public.configuracion 
WHERE key IN (
    'contact_whatsapp', 
    'contact_email', 
    'threshold_cogs_high', 
    'threshold_color_red'
);

-- Keep: 'contacto_whatsapp', 'umbral_costo_alto'
