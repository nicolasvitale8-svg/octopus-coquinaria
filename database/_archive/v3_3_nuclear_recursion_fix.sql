-- SCRIPT NUCLEAR V3.3: ELIMINACIÓN TOTAL DE RECURSIÓN
-- Este script desactiva temporalmente la seguridad para limpiar todo y volver a armarla.

-- 1. DETENER EL SANGRADO (Desactivar RLS temporalmente)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TODAS LAS POLÍTICAS DE USUARIOS (Conocidas y posibles)
DROP POLICY IF EXISTS "v3_users_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_select_admin" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "users_read_own" ON public.usuarios;
DROP POLICY IF EXISTS "users_read_all_admin" ON public.usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.usuarios;

-- 3. REDEFINIR FUNCIONES CON SEGURIDAD "DEFINER" (Bypassea RLS para evitar loop)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER -- ¡CLAVE! Ejecuta como superusuario
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (get_my_role() IN ('admin', 'consultant'));
$$;

-- 4. REACTIVAR RLS Y APLICAR POLÍTICAS SEGURAS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política 1: Cada uno ve lo suyo (Sin llamar a funciones complejas)
CREATE POLICY "v3_nuclear_users_own" ON public.usuarios FOR SELECT
USING ( auth.uid() = id );

-- Política 2: Admin ve todo (Usando la función SECURITY DEFINER segura)
CREATE POLICY "v3_nuclear_users_admin" ON public.usuarios FOR SELECT
USING ( is_admin_or_consultant() );

-- Política 3: Update propio
CREATE POLICY "v3_nuclear_users_update" ON public.usuarios FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 5. RE-BOOTSTRAP (Asegurar permisos al admin)
UPDATE public.usuarios
SET role = 'admin', permissions = '["super_admin"]'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'NUCLEAR FIX APLICADO: RLS REINICIADO Y RECURSIÓN ELIMINADA.' as status;
