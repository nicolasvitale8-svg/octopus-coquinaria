-- RESTAURAR ACCESO DE ADMINISTRADOR
-- Ejecuta este script para recuperar el control total del sistema.

-- 1. Forzar rol en tabla pública (Case insensitive)
UPDATE public.usuarios
SET 
  role = 'admin',
  permissions = '["super_admin", "all_access"]'::jsonb
WHERE email ILIKE '%nicolasvitale8%';

-- 2. Sincronizar metadatos de Auth (Por si acaso)
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email ILIKE '%nicolasvitale8%';

-- 3. Verificación
SELECT email, role, permissions FROM public.usuarios WHERE email ILIKE '%nicolasvitale8%';
