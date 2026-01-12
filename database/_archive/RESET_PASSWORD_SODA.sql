-- 🔍 RESET DE PASSWORD CORREGIDO PARA SODA OLIVA 🔍

-- 1. Actualizar solo campos permitidos
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  encrypted_password = crypt('Admin123', gen_salt('bf'))
WHERE email = 'soda.oliva@gmail.com';

-- 2. Asegurar que el perfil exista con el rol correcto
INSERT INTO public.usuarios (id, email, role, full_name)
SELECT id, email, 'consultant', 'Soda Oliva'
FROM auth.users 
WHERE email = 'soda.oliva@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'consultant';

SELECT '✅ Soda Oliva ahora tiene password Admin123 y email confirmado.' as status;
