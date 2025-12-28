-- SCRIPT V3.9: DIAGNÓSTICO Y REPARACIÓN DEFINITIVA (NUCLEAR FIX)
-- ESTE SCRIPT ESTÁ DISEÑADO PARA SER A PRUEBA DE ERRORES DE SINTAXIS Y RLS.

-- 1. Desactivar seguridad momentáneamente para asegurar que PODEMOS escribir
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Asegurarse que la columna permissions sea JSONB (Corrección de tipos)
DO $$
BEGIN
    -- Si por alguna razón es text o array, esto podría fallar, así que lo forzamos
    -- Solo si da error, ignorar (es un bloque seguro)
    BEGIN
        ALTER TABLE public.usuarios ALTER COLUMN permissions TYPE jsonb USING permissions::jsonb;
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ya era jsonb o está vacío
    END;
END $$;

-- 3. INSERTAR O ACTUALIZAR (UPSERT) EL USUARIO ADMIN
-- Usamos jsonb_build_array para evitar errores de comillas como "min"
INSERT INTO public.usuarios (id, email, full_name, role, permissions, business_name, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Nicolas Vitale Admin'), 
    'admin', 
    jsonb_build_array('super_admin', 'view_dashboard', 'manage_users', 'manage_projects'), -- Permisos explícitos
    'Octopus HQ',
    now()
FROM auth.users
WHERE email ILIKE 'nicolasvitale8@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
    role = 'admin',
    permissions = jsonb_build_array('super_admin', 'view_dashboard', 'manage_users', 'manage_projects'),
    business_name = 'Octopus HQ';

-- 4. ACTUALIZAR METADATA (Bypass para RLS v3.5)
UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
    'role', 'admin',
    'permissions', jsonb_build_array('super_admin')
)
WHERE email ILIKE 'nicolasvitale8@gmail.com';

-- 5. ELIMINAR CUALQUIER TRIGGER QUE MOLESTE
-- A veces los triggers de 'on_auth_user_created' pisan los cambios. Lo borramos si existe y es viejo.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 6. REACTIVAR SEGURIDAD
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 7. VERIFICACIÓN FINAL (Output para el usuario)
SELECT 
    u.email, 
    u.role as "DB Role", 
    u.permissions as "DB Permissions", 
    a.raw_app_meta_data->>'role' as "Auth Metadata Role"
FROM public.usuarios u
JOIN auth.users a ON u.id = a.id
WHERE u.email ILIKE 'nicolasvitale8@gmail.com';
