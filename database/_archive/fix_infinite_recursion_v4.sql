-- FIX INFINITE RECURSION V4 (DEFINITIVO)
-- Este script soluciona el error "la política ya existe" eliminando explícitamente nombres antiguos.

-- 1. Eliminar políticas con NOMBRES MÚLTIPLES (para asegurar limpieza)
DROP POLICY IF EXISTS "ver_usuario_propio_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "Ver usuarios propios o admin" ON public.usuarios;
DROP POLICY IF EXISTS "Select usuarios propios o admin" ON public.usuarios;

DROP POLICY IF EXISTS "modificar_usuario_propio_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "Modificar usuarios propios o admin" ON public.usuarios;
DROP POLICY IF EXISTS "Update usuarios propios o admin" ON public.usuarios;

DROP POLICY IF EXISTS "crear_usuario" ON public.usuarios;
DROP POLICY IF EXISTS "Crear usuarios (registro)" ON public.usuarios;
DROP POLICY IF EXISTS "Insert usuarios" ON public.usuarios;

-- 2. Función de seguridad (Bypass RLS para evitar recursión)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- ¡Clave! Se ejecuta como superusuario
SET search_path = public -- Seguridad
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 3. Crear Políticas Nuevas (Sin recursión)

-- LECTURA: Ver mi propio perfil O si soy admin
CREATE POLICY "ver_usuario_propio_o_admin"
ON public.usuarios
FOR SELECT
USING (
  auth.uid() = id
  OR
  public.is_admin() = true
);

-- ESCRITURA: Editar mi propio perfil O si soy admin
CREATE POLICY "modificar_usuario_propio_o_admin"
ON public.usuarios
FOR UPDATE
USING (
  auth.uid() = id
  OR
  public.is_admin() = true
);

-- INSERCIÓN: Cualquiera puede registrarse (necesario para sign up)
CREATE POLICY "crear_usuario"
ON public.usuarios
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- 4. Asegurar permisos
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

-- 5. FORZAR TU USUARIO COMO ADMIN (Crucial)
UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';

-- Mensaje de éxito
SELECT 'Fix V4 Aplicado Correctamente - Intenta recargar la app' as status;
