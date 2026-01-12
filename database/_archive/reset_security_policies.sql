-- MASTER SECURITY RESET (COMIENZO DE CERO)
-- Este script NO PARCHEA nada. BORRA toda la configuración de seguridad de la tabla usuarios y la hace de nuevo.

-- 1. Desactivar RLS momentáneamente (Para evitar bloqueos durante la limpieza)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Limpieza TOTAL (Borrar función y políticas en cadena)
-- El CASCADE eliminará cualquier política que dependa de is_admin() vieja
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Por seguridad, intentamos borrar políticas comunes que podrían haber quedado huérfanas
DROP POLICY IF EXISTS "ver_usuario_propio_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "modificar_usuario_propio_o_admin" ON public.usuarios;
DROP POLICY IF EXISTS "crear_usuario" ON public.usuarios;
DROP POLICY IF EXISTS "policy_read_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "policy_update_usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "policy_insert_usuarios" ON public.usuarios;

-- 3. Definir la Función "Maestra" de Autoridad
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER -- IMPORTANTE: Se ejecuta con permisos de superusuario, ignora RLS del usuario
SET search_path = public
STABLE
AS $$
  -- Retorna TRUE si el usuario actual tiene rol 'admin'
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- 4. Reactivar RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 5. Crear las 3 Políticas Maestras (Lectura, Escritura, Creación)

-- A. LECTURA: "Puedo ver mi propio usuario O, si soy admin, todos"
CREATE POLICY "master_policy_select_usuarios"
ON public.usuarios
FOR SELECT
USING (
  auth.uid() = id               -- Regla base: Soy yo
  OR
  public.is_admin() = true      -- Regla admin: Soy dios
);

-- B. EDICION: "Puedo editar mi propio usuario O, si soy admin, todos"
CREATE POLICY "master_policy_update_usuarios"
ON public.usuarios
FOR UPDATE
USING (
  auth.uid() = id 
  OR 
  public.is_admin() = true
);

-- C. CREACION: "Cualquiera autenticado puede insertarse a sí mismo (Registro)"
CREATE POLICY "master_policy_insert_usuarios"
ON public.usuarios
FOR INSERT
WITH CHECK (
  auth.uid() = id
);

-- 6. Permisos de Ejecución
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

-- 7. BOOTSTRAP (Forzar tu admin)
-- Esto asegura que TU cuenta específica tenga las llaves del reino para empezar
UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

-- Sincronizar también en auth.users para evitar latencia
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'Sistema de Seguridad Reiniciado Exitosamente' as status;
