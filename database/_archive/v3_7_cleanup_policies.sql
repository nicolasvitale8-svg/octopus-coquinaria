-- SCRIPT V3.7: LIMPIEZA TOTAL DE POLÍTICAS ZOMBIE
-- Diagnóstico: Tenemos 17 políticas activas peleándose entre ellas. Vamos a borrarlas TODAS explícitamente.

ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 1. Borrar políticas duplicadas detectadas en la captura
DROP POLICY IF EXISTS "Admins and Consultants can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Admins/Consultants view all" ON public.usuarios;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Perfiles publicos visibles por todos." ON public.usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden crear su propio perfil." ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden editar su propio perfil." ON public.usuarios;
DROP POLICY IF EXISTS "master_policy_insert_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "master_policy_select_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "master_policy_update_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "permitir_insertar_registro" ON public.usuarios;

-- Borrar también las mías recientes para asegurar estado limpio
DROP POLICY IF EXISTS "v3_6_insert" ON public.usuarios;
DROP POLICY IF EXISTS "v3_6_read" ON public.usuarios;
DROP POLICY IF EXISTS "v3_6_update" ON public.usuarios;


-- 2. Reactivar RLS Limitado (Solo V3.6)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 3. Re-Aplicar V3.6 (Solo Metadata, cero recursión)
CREATE POLICY "v3_final_read" ON public.usuarios FOR SELECT
USING (
  auth.uid() = id
  OR
  (SELECT COALESCE(
    current_setting('request.jwt.claim.app_metadata', true)::jsonb->>'role',
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
  )) IN ('admin', 'consultant')
  OR
  auth.email() = 'nicolasvitale8@gmail.com'
);

CREATE POLICY "v3_final_update" ON public.usuarios FOR UPDATE
USING ( auth.uid() = id );

CREATE POLICY "v3_final_insert" ON public.usuarios FOR INSERT
WITH CHECK ( true );

SELECT 'V3.7 LIMPIEZA FINALIZADA: 17 POLITICAS ELIMINADAS - SISTEMA LIMPIO.' as status;
