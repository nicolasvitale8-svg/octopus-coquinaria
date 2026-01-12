-- ==============================================================================
-- FIX VISIBILIDAD PROYECTOS
-- ==============================================================================

-- 1. Relajar la función is_admin para que chequee la tabla de usuarios también
-- Esto permite que si tu usuario está en la tabla "usuarios" con rol admin, funcione.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_meta boolean;
  is_admin_table boolean;
BEGIN
  -- Chequear Metadatos (Token)
  is_admin_meta := ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
  
  IF is_admin_meta THEN
    RETURN true;
  END IF;

  -- Chequear Tabla Usuarios (Fallback)
  SELECT (role = 'admin') INTO is_admin_table
  FROM public.usuarios
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_table, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Asegurar que la política de Proyectos sea accesible
-- Eliminamos la política estricta anterior y creamos una más abierta para usuarios autenticados.
DROP POLICY IF EXISTS "Admin projects full" ON public.projects;
DROP POLICY IF EXISTS "User projects read" ON public.projects;

CREATE POLICY "Allow Authenticated Projects" ON public.projects
FOR ALL TO authenticated
USING ( true )
WITH CHECK ( true );

-- 3. Verificar cuántos proyectos hay en la base de datos realmente
SELECT count(*) as cantidad_proyectos, 'Si este número es > 0, ahora deberías verlos.' as mensaje FROM public.projects;
