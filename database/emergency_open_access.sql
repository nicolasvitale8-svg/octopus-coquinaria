-- EMERGENCY OPEN ACCESS
-- OBJETIVO: Mostrar los datos SI O SI.
-- Desactiva la seguridad RLS en las tablas de contenido.
-- ESTO HARA QUE LOS DATOS SEAN VISIBLES INMEDIATAMENTE.

-- 1. Proyectos: Desactivar seguridad
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Academia: Desactivar seguridad
ALTER TABLE public.recursos_academia DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_resources DISABLE ROW LEVEL SECURITY; -- (Por si acaso usaste el nombre en inglés)

-- 3. Leads: Desactivar seguridad
ALTER TABLE public.diagnosticos_express DISABLE ROW LEVEL SECURITY;

-- 4. Verificación
SELECT 'Seguridad desactivada. Los datos DEBEN ser visibles ahora.' as status;
