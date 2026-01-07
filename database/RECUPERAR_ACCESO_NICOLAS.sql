-- 🔥 SOLUCIÓN RÁPIDA: RECUPERAR ACCESO NICOLÁS 🔥
-- Ejecuta esto en el SQL EDITOR de tu Supabase Dashboard

-- 1. Resetear la contraseña a: Octopus2026!
UPDATE auth.users
SET encrypted_password = crypt('Octopus2026!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    confirmed_at = COALESCE(confirmed_at, now()),
    last_sign_in_at = NULL
WHERE email = 'nicolasvitale8@gmail.com';

-- 2. Asegurar que el perfil de Admin exista con todos los permisos
INSERT INTO public.usuarios (id, email, role, full_name, permissions)
SELECT id, email, 'admin', 'Nicolas Vitale', ARRAY['super_admin']
FROM auth.users
WHERE email = 'nicolasvitale8@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    permissions = ARRAY['super_admin'];

SELECT '✅ LISTO! Ya puedes entrar con Octopus2026!' as status;
