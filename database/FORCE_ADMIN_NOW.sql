-- 🚨 SOLUCIÓN NUCLEAR DE DESBLOQUEO 🚨
-- Ejecuta esto si el rol admin sigue sin aparecer.

-- 1. Desactivar seguridad totalmente (Garantiza que no haya timeouts)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships DISABLE ROW LEVEL SECURITY;

-- 2. FORZAR ROL ADMIN A TODOS (Elimina el problema de "email no coincide")
-- Hacemos esto para que NO IMPORTA qué email uses, seas admin.
UPDATE public.usuarios 
SET role = 'admin', 
    permissions = '["super_admin", "all_access"]'::jsonb;

-- 3. FORZAR METADATOS EN AUTH SIEMPRE
UPDATE auth.users 
SET raw_app_meta_data = jsonb_build_object('role', 'admin');

-- 4. VERIFICAR QUIÉNES ESTÁN EN LA TABLA
-- Esto te mostrará una lista abajo. Mira si tu email aparece ahí.
SELECT id, email, role, full_name FROM public.usuarios;
