-- 🔥 FIX_RLS_MEMBRESIA.sql 🔥
-- Corrige el error: "new row violates row-level security policy for table 'business_memberships'"

-- 1. Eliminar política restrictiva anterior (que solo era SELECT)
DROP POLICY IF EXISTS "policy_memberships_visibility" ON public.business_memberships;

-- 2. Crear política integral para que el ADMIN pueda gestionar TODO
-- Y los usuarios puedan VER lo suyo.
CREATE POLICY "policy_memberships_admin_all" ON public.business_memberships
FOR ALL TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (user_id = auth.uid())
)
WITH CHECK (
  (public.get_auth_role() = 'admin')
);

-- 3. Por seguridad, permitimos que cualquier usuario vea sus propias membresías (SELECT)
-- Aunque la política 'ALL' ya lo cubre, ser explícito ayuda a veces con PostgREST.
DROP POLICY IF EXISTS "policy_memberships_select_own" ON public.business_memberships;
CREATE POLICY "policy_memberships_select_own" ON public.business_memberships
FOR SELECT TO authenticated
USING (
  (public.get_auth_role() = 'admin') OR 
  (user_id = auth.uid())
);

SELECT '✅ Políticas de membresía actualizadas. Ya puedes asignar proyectos.' as result;
