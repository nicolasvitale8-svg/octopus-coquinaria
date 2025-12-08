-- 1. Confirmar el email del usuario (CRÍTICO para evitar "Email not confirmed")
-- Esto actualiza la tabla interna de autenticación de Supabase
UPDATE auth.users
SET email_confirmed_at = now(),
    raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb),
        '{provider}',
        '"email"'
    )
WHERE email = 'admin@octopus.com';

-- 2. Insertar/Actualizar en tabla publica usuarios
INSERT INTO public.usuarios (id, email, full_name, role)
SELECT 
    id, 
    email, 
    'Super Admin', 
    'admin'
FROM auth.users 
WHERE email = 'admin@octopus.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Super Admin';

-- 3. Asegurar doblemente que sea admin
UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'admin@octopus.com';

-- 4. Verificar resultados
SELECT id, email, role FROM public.usuarios WHERE email = 'admin@octopus.com';
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@octopus.com';
