-- 🔥 HABILITAR_TODO.sql 🔥
-- Desactiva la seguridad RLS en las tablas que faltaban para que el Admin vea todo el contenido.

-- 1. DESACTIVAR RLS EN TABLAS DE CONTENIDO
ALTER TABLE IF EXISTS public.eventos_calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recursos_academia DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diagnosticos_express DISABLE ROW LEVEL SECURITY;

-- 2. LIMPIAR POLÍTICAS (Para evitar ruidos)
DROP POLICY IF EXISTS "v3_academy_select" ON public.recursos_academia;
DROP POLICY IF EXISTS "v3_academy_modify" ON public.recursos_academia;
DROP POLICY IF EXISTS "v3_leads_all" ON public.diagnosticos_express;
DROP POLICY IF EXISTS "v3_leads_insert_public" ON public.diagnosticos_express;

-- 3. VERIFICAR QUE EL ADMIN TENGA ROL CORRECTO (Un refuerzo más)
UPDATE public.usuarios 
SET role = 'admin', 
    permissions = '["super_admin", "all_access"]'::jsonb 
WHERE email = 'nicolasvitale8@gmail.com';

SELECT '✅ Calendario, Academia y Leads habilitados con éxito.' as status;
