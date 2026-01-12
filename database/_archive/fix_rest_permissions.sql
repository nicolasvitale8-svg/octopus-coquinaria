-- FIX REST PERMISSIONS (Nuclear Option Enabler)
-- Allows the 'anon' key (used by our REST sync) to INSERT/UPDATE data.

-- 1. Enable Anon Access for Academy Resources
DROP POLICY IF EXISTS "Recursos lectura publica." ON public.recursos_academia;
DROP POLICY IF EXISTS "Recursos solo admin modifica." ON public.recursos_academia;
DROP POLICY IF EXISTS "Allow Public Sync Academy" ON public.recursos_academia; -- Added safety drop

CREATE POLICY "Allow Public Sync Academy" ON public.recursos_academia
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Enable Anon Access for Calendar Events
DROP POLICY IF EXISTS "Eventos lectura publica." ON public.eventos_calendario;
DROP POLICY IF EXISTS "Eventos solo admin modifica." ON public.eventos_calendario;
DROP POLICY IF EXISTS "Allowed Public" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Allow Public Sync Calendar" ON public.eventos_calendario; -- Added safety drop

CREATE POLICY "Allow Public Sync Calendar" ON public.eventos_calendario
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Ensure Diagnosticos/Leads are also open (just in case)
DROP POLICY IF EXISTS "Cualquiera puede insertar diagnosticos express." ON public.diagnosticos_express;
DROP POLICY IF EXISTS "Allow Public Sync Leads" ON public.diagnosticos_express; -- Added safety drop

CREATE POLICY "Allow Public Sync Leads" ON public.diagnosticos_express
FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Grants
GRANT ALL ON TABLE public.recursos_academia TO anon;
GRANT ALL ON TABLE public.eventos_calendario TO anon;
GRANT ALL ON TABLE public.diagnosticos_express TO anon;
