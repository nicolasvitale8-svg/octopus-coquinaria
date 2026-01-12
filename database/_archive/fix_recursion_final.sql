-- ==============================================================================
-- FIX DE RECURSIÓN INFINITA + PROMOCIÓN DE ADMIN
-- ==============================================================================

-- 1. Promover explícitamente a tu usuario (por email) a ADMIN en los metadatos.
-- Esto hace que el chequeo sea instantáneo y no tenga que buscar en tablas (evitando el bucle).
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || 
  '{"provider": "email", "role": "admin"}'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';  -- <--- TU EMAIL REAL

-- 2. Simplificar la función de seguridad para que SOLO confíe en el metadato.
-- Al eliminar la consulta a la tabla 'usuarios', eliminamos la posibilidad de error de "bucle infinito".
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Si el token dice que es admin, ES admin. Punto.
  RETURN ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Confirmación
SELECT email, raw_app_meta_data FROM auth.users WHERE email = 'nicolasvitale8@gmail.com';
