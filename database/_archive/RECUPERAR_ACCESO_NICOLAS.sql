-- 🔥 PASO FINAL: ASIGNAR PERMISOS DE ADMINISTRADOR 🔥
-- Ejecuta esto en el SQL Editor para tener acceso total.

INSERT INTO public.usuarios (id, email, role, full_name, permissions)
SELECT id, email, 'admin', 'Nicolas Vitale', '["super_admin"]'::jsonb
FROM auth.users
WHERE email = 'nicolasvitale8@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    permissions = '["super_admin"]'::jsonb;

SELECT '✅ ACCESO TOTAL CONCEDIDO! Ya puedes loguearte en la web.' as status;
