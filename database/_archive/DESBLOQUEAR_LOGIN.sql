-- 🔥 DESBLOQUEAR_LOGIN.sql 🔥
-- Ejecuta esto si los nuevos usuarios no pueden entrar.

-- 1. Auto-confirmar todos los correos electrónicos 
-- (Supabase por defecto pide que el usuario haga clic en un link, esto lo salta)
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW(),
    last_sign_in_at = NULL -- Reset por seguridad
WHERE email_confirmed_at IS NULL;

-- 2. Asegurar que los perfiles en public.usuarios tengan el ID correcto y rol
-- (Refuerzo de sincronización)
INSERT INTO public.usuarios (id, email, role, full_name)
SELECT id, email, 'consultant', COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.usuarios)
ON CONFLICT (id) DO NOTHING;

-- 3. Ver lista de usuarios para confirmar que están "confirmados"
SELECT email, email_confirmed_at, last_sign_in_at 
FROM auth.users;

SELECT '✅ Usuarios confirmados. Ya deberían poder iniciar sesión con su contraseña.' as status;
