-- FIX V3.2: CORREGIR RECURSIÓN INFINITA
-- Problema: La función `get_my_role()` hacía `SELECT FROM usuarios`.
-- La tabla `usuarios` tiene una política RLS que llama a `is_admin_or_consultant()`.
-- `is_admin_or_consultant()` llama a `get_my_role()`.
-- BUCLE INFINITO: SELECT -> Policy -> Function -> SELECT -> Policy...

-- Solución: Usar `SECURITY DEFINER` en las funciones helper.
-- Esto hace que la función se ejecute con los permisos de quien la creó (postgres/admin),
-- BYPASSING RLS para esa consulta específica interna.

-- 1. Redefinir `get_my_role` con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER -- <--- ESTO ROMPE EL BUCLE
SET search_path = public -- Buena práctica de seguridad
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 2. Redefinir `is_admin_or_consultant` con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- <--- ESTO ROMPE EL BUCLE
SET search_path = public
AS $$
  SELECT (get_my_role() IN ('admin', 'consultant'));
$$;

-- 3. Redefinir `has_permission` con SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER -- <--- ESTO ROMPE EL BUCLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid()
    AND permissions @> to_jsonb(perm) -- JSONB contains check
  );
$$;

-- 4. VERIFICACIÓN: Forzar actualización del usuario para asegurar que todo esté limpio
UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'Fix V3.2 Aplicado: Funciones ahora son SECURITY DEFINER (No más loops).' as status;
