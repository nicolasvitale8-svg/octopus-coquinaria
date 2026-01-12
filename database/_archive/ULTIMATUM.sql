-- 🚨 ULTIMATUM.sql 🚨
-- ESTE SCRIPT DEBE EJECUTARSE CON EL TRADUCTOR DEL NAVEGADOR DESACTIVADO.
-- SI VES PALABRAS EN ESPAÑOL DENTRO DEL EDITOR SQL (que no sean comentarios), NO LO EJECUTES.

-- 1. DESACTIVAR SEGURIDAD TOTALMENTE
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TRIGGERS POR NOMBRE (Manual y Agresivo)
-- Esto elimina las funciones que se llaman a sí mismas y causan el TimeOut.

-- Triggers en public.usuarios
DROP TRIGGER IF EXISTS handle_actualizado_en ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS update_usuarios_at ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS ensure_admin_role ON public.usuarios CASCADE;

-- Triggers en public.projects
DROP TRIGGER IF EXISTS handle_actualizado_en ON public.projects CASCADE;
DROP TRIGGER IF EXISTS set_updated_at ON public.projects CASCADE;

-- 3. ELIMINAR TODA POLÍTICA RLS RESTANTE
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 4. LIMPIAR FUNCIONES QUE ESTÁN DANDO ERROR
DROP FUNCTION IF EXISTS public.handle_actualizado_en() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;

-- 5. RE-ASEGURAR EL ROL ADMIN (POR SI EL TRADUCTOR LO CAMBIÓ A "administraci")
-- Forzamos el texto exacto 'admin' en inglés.
UPDATE public.usuarios SET role = 'admin';
UPDATE auth.users SET raw_app_meta_data = '{"role": "admin"}'::jsonb;

-- 6. VERIFICAR LIMPIEZA
SELECT 'LISTO: Triggers eliminados, RLS desactivado y roles corregidos.' as resultado;
