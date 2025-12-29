-- ==============================================================================
-- 🐙 FIX CONSOLIDADO: SINCRONIZACIÓN Y SEGURIDAD V4
-- Este script recrea los roles, migra los miembros y arregla avisos de RLS.
-- ==============================================================================

-- 1. SEMILLAS: Roles y Permisos (Si no existen)
INSERT INTO public.roles (id, name, description) VALUES
('admin', 'Administrador', 'Control total de la plataforma'),
('consultant', 'Consultor', 'Gestión de proyectos y tareas'),
('client', 'Cliente / Dueño', 'Vista de avances y aprobaciones'),
('manager', 'Gerente', 'Gestión operativa del local')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. SINCRONIZACIÓN DE MIEMBROS (Migración)
-- Mapea todos los usuarios de business_memberships y proyectos existentes a la nueva tabla V4
INSERT INTO public.project_members (project_id, user_id, role_id)
SELECT 
    p.id as project_id, 
    bm.user_id as user_id,
    COALESCE(
        (SELECT role FROM public.usuarios WHERE id = bm.user_id LIMIT 1), 
        'consultant'
    ) as role_id
FROM public.projects p
JOIN public.business_memberships bm ON p.business_id = bm.business_id
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Asegurar q Nicolás esté como dueño técnico de todo
INSERT INTO public.project_members (project_id, user_id, role_id)
SELECT 
    p.id, 
    u.id, 
    'admin'
FROM public.projects p, public.usuarios u
WHERE u.email = 'nicolasvitale8@gmail.com'
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 3. PARCHES DE SEGURIDAD CRÍTICOS (Avisos de Supabase)

-- Calendario
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select eventos" ON public.eventos_calendario;
CREATE POLICY "Public select eventos" ON public.eventos_calendario 
FOR SELECT TO authenticated USING (true);

-- Academia
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select academia" ON public.recursos_academia;
CREATE POLICY "Public select academia" ON public.recursos_academia 
FOR SELECT TO authenticated USING (true);

-- 4. FIX: Búsqueda segura (Security Search Path)
-- Para evitar avisos de seguridad de Supabase en funciones ya definidas
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.is_member_of_project(uuid) SET search_path = public;

SELECT '✅ FIX CONSOLIDADO COMPLETADO. Revisar el selector de tareas ahora.' as status;
