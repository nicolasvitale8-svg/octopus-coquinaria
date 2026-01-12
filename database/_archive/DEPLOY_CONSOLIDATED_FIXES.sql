-- ==========================================
-- 🚀 DEPLOY_CONSOLIDATED_FIXES.sql 🚀
-- Consolidado de Calibración de Seguridad V3
-- Fecha: 28/12/2025
-- ==========================================

-- 1. ESTRUCTURA Y RELACIONES (La base de todo)
-----------------------------------------------

-- Asegurar Clave Foránea de Membresías a Proyectos
ALTER TABLE IF EXISTS public.business_memberships 
DROP CONSTRAINT IF EXISTS business_memberships_business_id_fkey;

ALTER TABLE public.business_memberships
ADD CONSTRAINT business_memberships_business_id_fkey 
FOREIGN KEY (business_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- Asegurar Clave Foránea de Membresías a Usuarios
ALTER TABLE IF EXISTS public.business_memberships 
DROP CONSTRAINT IF EXISTS business_memberships_user_id_fkey;

ALTER TABLE public.business_memberships
ADD CONSTRAINT business_memberships_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.usuarios(id) 
ON DELETE CASCADE;


-- 2. REGLAS DE VISIBILIDAD (RLS)
-----------------------------------------------

-- Habilitar RLS en tablas núcleo
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;

-- Función de ayuda para roles (Sin recursión)
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- Política de Proyectos: Solo Administradores o Usuarios Asignados
DROP POLICY IF EXISTS "policy_projects_visibility" ON public.projects;
CREATE POLICY "policy_projects_visibility" ON public.projects
FOR ALL TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (id IN (SELECT business_id FROM public.business_memberships WHERE user_id = auth.uid()))
);

-- Política de Membresías: Admin gestiona todo, Usuarios ven lo suyo
DROP POLICY IF EXISTS "policy_memberships_admin_all" ON public.business_memberships;
CREATE POLICY "policy_memberships_admin_all" ON public.business_memberships
FOR ALL TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (user_id = auth.uid())
)
WITH CHECK (
  (public.get_auth_role() = 'admin')
);

-- Política de Leads: Admin ve todo, Clientes ven sus propios diagnósticos
DROP POLICY IF EXISTS "policy_leads_visibility" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_visibility" ON public.diagnosticos_express
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (contact_email = auth.jwt()->>'email')
);

-- Permitir creación de Leads desde la web (Público)
DROP POLICY IF EXISTS "policy_leads_insert" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_insert" ON public.diagnosticos_express
FOR INSERT TO anon, authenticated
WITH CHECK (true);


-- 3. MANTENIMIENTO DE METADATOS
-----------------------------------------------
COMMENT ON TABLE public.business_memberships IS 'Mapeo de usuarios a proyectos Octopus';
COMMENT ON TABLE public.diagnosticos_express IS 'Leads y resultados de diagnóstico rápido';

SELECT '✅ PRODUCCIÓN ACTUALIZADA: Seguridad y relaciones activas.' as status;
