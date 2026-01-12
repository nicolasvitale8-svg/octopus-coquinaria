-- 🔥 REGLAS_VISIBILIDAD_V1.sql 🔥
-- Implementa la lógica: "Solo veo lo que me pertenece o me asignaron".

-- 1. Habilitar RLS en tablas críticas
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;

-- 2. Función auxiliar para leer rol sin recursión (usuarios tiene RLS desactivado)
CREATE OR REPLACE FUNCTION public.get_auth_role() 
RETURNS text 
LANGUAGE sql 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 3. POLÍTICAS PARA PROYECTOS
DROP POLICY IF EXISTS "policy_projects_visibility" ON public.projects;
CREATE POLICY "policy_projects_visibility" ON public.projects
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (id IN (SELECT business_id FROM public.business_memberships WHERE user_id = auth.uid()))
);

-- Permiso para modificar (Solo Admin o el que está asignado?)
-- Por ahora, permitimos a los asignados editar para que el Hub funcione para colaboradores
DROP POLICY IF EXISTS "policy_projects_modify" ON public.projects;
CREATE POLICY "policy_projects_modify" ON public.projects
FOR ALL TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (id IN (SELECT business_id FROM public.business_memberships WHERE user_id = auth.uid()))
);

-- 4. POLÍTICAS PARA MEMBRESÍAS
DROP POLICY IF EXISTS "policy_memberships_visibility" ON public.business_memberships;
CREATE POLICY "policy_memberships_visibility" ON public.business_memberships
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (user_id = auth.uid())
);

-- 5. POLÍTICAS PARA LEADS (DIAGNOSTICOS)
DROP POLICY IF EXISTS "policy_leads_visibility" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_visibility" ON public.diagnosticos_express
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (contact_email = auth.jwt()->>'email')
);

-- 6. PERMITIR INSERTAR LEADS (Público)
DROP POLICY IF EXISTS "policy_leads_insert" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_insert" ON public.diagnosticos_express
FOR INSERT TO anon, authenticated
WITH CHECK (true);

SELECT '✅ Reglas de visibilidad aplicadas con éxito.' as status;
