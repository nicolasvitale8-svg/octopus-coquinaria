-- FORCE PROJECTS VISIBILITY
-- Este script elimina las restricciones complejas en Proyectos para asegurar que puedas verlos y asignarlos.

-- 1. Tabla PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Eliminamos políticas viejas que podrían estar fallando
DROP POLICY IF EXISTS "v3_projects_select" ON public.projects;
DROP POLICY IF EXISTS "v3_projects_insert" ON public.projects;
DROP POLICY IF EXISTS "v3_projects_update" ON public.projects;
DROP POLICY IF EXISTS "v3_projects_delete" ON public.projects;
DROP POLICY IF EXISTS "permit_select_all" ON public.projects;

-- CREAMOS POLÍTICA LIBRE (Todos los usuarios autenticados pueden ver y editar proyectos)
-- Esto es temporal para desbloquear tu trabajo.
CREATE POLICY "emergency_projects_all" ON public.projects FOR ALL
USING ( auth.role() = 'authenticated' )
WITH CHECK ( auth.role() = 'authenticated' );


-- 2. Tabla BUSINESS_MEMBERSHIPS (Necesaria para guardar la asignación)
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_all" ON public.business_memberships;
DROP POLICY IF EXISTS "emergency_memberships_all" ON public.business_memberships;

CREATE POLICY "emergency_memberships_all" ON public.business_memberships FOR ALL
USING ( auth.role() = 'authenticated' )
WITH CHECK ( auth.role() = 'authenticated' );


SELECT 'VISIBILIDAD FORZADA: Ahora deberías ver todos los proyectos (ej. Colifa Bar).' as status;
