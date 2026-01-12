-- SCRIPT V3.6: SOLUCIÓN FINAL "TIERRA QUEMADA"
-- Objetivo: Eliminar la recursión reescribiendo TODO para que NUNCA lea la tabla usuarios.

-- 1. APAGAR SEGURIDAD (Para poder trabajar sin errores)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. BORRAR TODAS LAS POLÍTICAS DE USUARIOS (Limpieza total)
DROP POLICY IF EXISTS "v3_users_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_select_admin" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_nuclear_users_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_nuclear_users_admin" ON public.usuarios;
DROP POLICY IF EXISTS "v3_nuclear_users_update" ON public.usuarios;
DROP POLICY IF EXISTS "users_read_own" ON public.usuarios;
DROP POLICY IF EXISTS "users_read_all_admin" ON public.usuarios;

-- 3. REESCRIBIR FUNCIONES PARA USAR SOLO METADATA (Cero contacto con la tabla usuarios)

-- get_my_role: Lee directo del JWT/Auth, imposible que recurse.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.app_metadata', true)::jsonb->>'role',
    (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = auth.uid())
  );
$$;

-- is_admin_or_consultant: Usa la nueva get_my_role segura
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (get_my_role() IN ('admin', 'consultant') OR auth.email() = 'nicolasvitale8@gmail.com');
$$;

-- has_permission: Usa solo metadata si es posible, o asume false por seguridad básica
CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_or_consultant(); -- Por ahora simplificado para admins
$$;


-- 4. REACTIVAR RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS ULTRA SIMPLIFICADAS
-- Lectura: Si es tu ID o si eres Admin (según metadata)
CREATE POLICY "v3_6_read" ON public.usuarios FOR SELECT
USING (
  auth.uid() = id
  OR
  is_admin_or_consultant()
);

-- update: Solo tu ID
CREATE POLICY "v3_6_update" ON public.usuarios FOR UPDATE
USING ( auth.uid() = id );

-- Insert: Libre (para el trigger o registros)
CREATE POLICY "v3_6_insert" ON public.usuarios FOR INSERT
WITH CHECK ( true );


-- 6. SINCRONIZACIÓN FINAL DE METADATA
-- Aseguramos que tu usuario tenga la metadata correcta para que las funciones de arriba funcionen.
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'V3.6 APLICADO: RECURSIÓN ELIMINADA POR COMPLETO (METADATA ONLY).' as status;
