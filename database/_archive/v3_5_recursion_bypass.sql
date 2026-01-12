-- SCRIPT V3.5: ESTRATEGIA DE BYPASS DE RECURSIÓN
-- Problema: Las políticas RLS de 'usuarios' consultaban a 'usuarios' para ver si eras admin. Eso crea un bucle.
-- Solución: Consultar 'auth.users' (Metadata) que está fuera del RLS.

-- 1. Redefinir la función de chequeo de Admin para que NO toque la tabla public.usuarios
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- En lugar de buscar en public.usuarios, miramos los metadatos de la sesión/auth
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
        (raw_app_meta_data->>'role') IN ('admin', 'consultant')
        OR
        (raw_user_meta_data->>'role') IN ('admin', 'consultant')
        OR
        email = 'nicolasvitale8@gmail.com' -- Hardcoded Safety Net
    )
  );
$$;

-- 2. Asegurar que los metadatos estén sync
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'nicolasvitale8@gmail.com';

UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

-- 3. Reconectar políticas RLS (Por si acaso alguna quedó apuntando mal)
-- No hace falta borrarlas si usan la función is_admin_or_consultant(), ya que al cambiar la función, la política se arregla sola.

SELECT 'FIX V3.5 APLICADO: FUNCIONES DE SEGURIDAD REESCRITAS PARA LEER METADATA.' as status;
