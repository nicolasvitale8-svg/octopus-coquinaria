-- FORCE ADMIN ALL
-- Este script convierte a TODOS los usuarios registrados en ADMIN.
-- Úsalo si el anterior no funcionó (probablemente por diferencias de mayúsculas en el email).

-- 1. Actualizar tabla pública
UPDATE public.usuarios
SET role = 'admin';

-- 2. Actualizar metadatos de autenticación (Auth Users)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb;

-- 3. Verificar resultado
SELECT email, role FROM public.usuarios;
