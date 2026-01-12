-- RESET DATABASE (KEEP ADMINS)
-- Deletes all business data to allow a fresh sync from local app.

-- 1. TRUNCATE DATA TABLES
-- Use CASCADE to handle potential foreign keys.
TRUNCATE TABLE public.projects, 
               public.diagnosticos_express, 
               public.diagnosticos_completos,
               public.eventos_calendario,
               public.recursos_academia
               CASCADE;

-- 2. DROP OBSOLETE/DUPLICATE TABLES
-- "calendar_events" is legacy. The app uses "eventos_calendario".
DROP TABLE IF EXISTS public.calendar_events;

-- Note: We are NOT deleting 'usuarios' or 'auth.users' as requested.
-- Note: We are NOT deleting 'configuracion' to preserve settings.
