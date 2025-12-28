-- DIAGNÓSTICO Y FIX FINAL
-- Ejecuta esto en Supabase para ver qué está pasando y repararlo

-- 1. VER QUÉ HAY EN LA TABLA USUARIOS
SELECT id, email, role, full_name FROM public.usuarios;

-- 2. VER SI TU EMAIL ESTÁ AHÍ
SELECT * FROM public.usuarios WHERE email ILIKE '%nicolasvitale8%';

-- 3. VER QUÉ HAY EN AUTH.USERS
SELECT id, email FROM auth.users;

-- 4. SINCRONIZAR: Asegurar que exista un perfil para cada usuario de auth
INSERT INTO public.usuarios (id, email, full_name, role, permissions)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email),
    'admin',
    '["super_admin"]'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios)
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', permissions = '["super_admin"]'::jsonb;

-- 5. CONFIRMAR QUE AHORA SÍ ESTÁN
SELECT id, email, role, full_name FROM public.usuarios;
