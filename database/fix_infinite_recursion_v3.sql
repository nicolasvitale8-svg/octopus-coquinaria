-- ==========================================
-- FIX DEFINITIVO DE RECURSIÓN Y PERMISOS (v3)
-- ==========================================

-- 1. Asegurar que la función is_admin existe y es SEGURA (no lee tablas)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Revisa metadatos de usuario O si el rol en la tabla usuarios es 'admin'
  -- PERO para evitar recursion, usamos una query directa sin pasar por RLS
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_app_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER es clave para saltar RLS

-- 2. Limpiar TODAS las políticas viejas de usuarios para empezar de cero
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todo" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden editar su perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Publico puede crear usuario" ON public.usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.usuarios;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.usuarios;
DROP POLICY IF EXISTS "ver_propios_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "crear_si_no_existe" ON public.usuarios;
DROP POLICY IF EXISTS "actualizar_propios" ON public.usuarios;

-- 3. Habilitar RLS explícitamente
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 4. Crear Políticas SIMPLES y NO RECURSIVAS

-- A) LECTURA: Cada uno ve lo suyo O es admin (usando la función segura)
CREATE POLICY "ver_usuario_propio_o_admin"
ON public.usuarios
FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin()
);

-- B) INSERTAR: Permitir a cualquiera (autenticado o anonimo) crear su perfil
-- Esto arregla el problema de registro inicial
CREATE POLICY "permitir_insertar_registro"
ON public.usuarios
FOR INSERT
WITH CHECK (auth.uid() = id);

-- C) ACTUALIZAR: Solo el propio usuario o admin
CREATE POLICY "permitir_actualizar_propio_o_admin"
ON public.usuarios
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  public.is_admin()
);

-- 5. Asegurar que tu usuario específico sea ADMIN (Metadatos + Tabla)
UPDATE public.usuarios 
SET role = 'admin' 
WHERE email = 'nicolasvitale8@gmail.com';  -- Reemplaza con tu email si es diferente

-- También actualizar metadatos de auth para consistencia
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';
