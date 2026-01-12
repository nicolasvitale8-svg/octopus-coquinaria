-- SCRIPT V3.8: FORZAR ROL ADMIN (CASE INSENSITIVE)
-- Diagnóstico: El usuario sigue como 'client' porque quizás el email tiene mayúsculas y el script anterior no lo encontró.

-- 1. Actualizar en PUBLIC.USUARIOS (Perfil visible)
UPDATE public.usuarios
SET role = 'admin', permissions = '["super_admin"]'::jsonb
WHERE email ILIKE 'nicolasvitale8@gmail.com';

-- 2. Actualizar en AUTH.USERS (Metadata invisible para RLS)
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email ILIKE 'nicolasvitale8@gmail.com';

SELECT 'V3.8 APLICADO: USUARIO OBLIGADO A SER ADMIN (ILIKE CHECK).' as status;
