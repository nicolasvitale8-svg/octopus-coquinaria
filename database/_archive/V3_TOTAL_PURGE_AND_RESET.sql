-- 🔥 V3_TOTAL_PURGE_AND_RESET.sql 🔥
-- ESTA ES LA ÚNICA VERDAD. BORRA RASTROS DE 15 DÍAS DE PARCHES Y EMPIEZA DE CERO.

-- ==============================================================================
-- 1. LIMPIEZA ABSOLUTA (ELIMINAR TODO)
-- ==============================================================================

-- Desactivar RLS preventivamente
ALTER TABLE IF EXISTS public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_memberships DISABLE ROW LEVEL SECURITY;

-- 1.1 BORRAR TODOS LOS TRIGGERS (ELIMINA BUCLES INFINITOS)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_object_table 
              FROM information_schema.triggers 
              WHERE event_object_schema = 'public') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END $$;

-- 1.2 BORRAR TODAS LAS POLÍTICAS RLS (ELIMINA RECURSIÓN)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 1.3 BORRAR FUNCIONES DE SEGURIDAD VIEJAS
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_consultant() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ==============================================================================
-- 2. REINSTALACIÓN MÍNIMA (SOLO LO QUE FUNCIONA)
-- ==============================================================================

-- 2.1 Asegurar Columnas Críticas
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.usuarios ADD COLUMN IF NOT EXISTS full_name text;

-- 2.2 Recrear Función de Verificación de Admin (Simple y sin RLS)
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- ==============================================================================
-- 3. ESTADO DE SEGURIDAD (DESACTIVADO POR AHORA PARA TRABAJAR)
-- ==============================================================================

-- Mantenemos RLS desactivado en las tablas principales para asegurar acceso inmediato.
-- Esto garantiza que NO haya errores de "Permission denied" ni timeouts.
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 4. RESTAURAR TU ACCESO (FORZADO)
-- ==============================================================================

-- En la tabla de usuarios del sistema
UPDATE public.usuarios 
SET role = 'admin', 
    permissions = '["super_admin"]'::jsonb 
WHERE email ILIKE '%nicolasvitale8%';

-- En los metadatos de autenticación de Supabase (Evita lag en AuthContext)
UPDATE auth.users 
SET raw_app_meta_data = jsonb_build_object('role', 'admin') 
WHERE email ILIKE '%nicolasvitale8%';

SELECT '✅ OPERACIÓN DE REINICIO TOTAL EXITOSA. RLS DESACTIVADO Y ACCESO ADMIN RESTAURADO.' as status;
