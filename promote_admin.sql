-- 1. Intentar insertar desde auth si falta
INSERT INTO public.usuarios (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Promover a CUALQUIER Nicolas Vitale (con o sin 8)
UPDATE public.usuarios
SET role = 'admin'
WHERE email LIKE 'nicolasvitale%';

-- 3. IMPORTANTE: Mostrar qué usuarios quedaron
SELECT email, role FROM public.usuarios;
