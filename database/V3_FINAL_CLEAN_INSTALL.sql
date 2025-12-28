-- 🔥 V3 FINAL CLEAN INSTALL 🔥
-- ESTE SCRIPT BORRA TODA LA CONFIGURACIÓN DE SEGURIDAD FALLIDA Y REINSTALA SOLO LO QUE SIRVE.
-- EJECÚTALO UNA SOLA VEZ EN SUPABASE.

-- ==============================================================================
-- 1. FASE DE PURGA (ELIMINAR TODO LO VIEJO)
-- ==============================================================================

-- Desactivar seguridad temporalmente para evitar bloqueos durante la limpieza
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships DISABLE ROW LEVEL SECURITY;

-- 1.1 BORRAR TRIGGERS (Causa principal de bucles infinitos/timeouts)
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON public.usuarios;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
-- Borrar TODOS los triggers de la tabla usuarios (Barrido final)
DO $$ DECLARE trg text; BEGIN 
    FOR trg IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_schema = 'public' AND event_object_table = 'usuarios' LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.usuarios CASCADE;', trg); 
    END LOOP; 
END $$;

-- 1.2 BORRAR FUNCIONES VIEJAS/RECURSIVAS
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE; -- Se recreará limpia
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE; -- Se recreará limpia
DROP FUNCTION IF EXISTS public.is_admin_or_consultant() CASCADE; -- Se recreará limpia

-- 1.3 BORRAR TODAS LAS POLÍTICAS RLS (Para no tener "duplicados" ni reglas zombis)
DO $$ DECLARE pol record; BEGIN 
    FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename); 
    END LOOP; 
END $$;


-- ==============================================================================
-- 2. FASE DE ESTRUCTURA (SOLO LO QUE SIRVE)
-- ==============================================================================

-- Asegurar tablas necesarias para el sistema V3
CREATE TABLE IF NOT EXISTS public.businesses (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, name text NOT NULL);
CREATE TABLE IF NOT EXISTS public.business_memberships (business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE, user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE, member_role text DEFAULT 'manager', PRIMARY KEY (business_id, user_id));

-- Asegurar columnas en Usuarios (Perfil)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS notes text;

-- Asegurar Proyectos vinculados a Negocios
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);


-- ==============================================================================
-- 3. FASE DE LÓGICA V3 (SIMPLE Y SEGURA)
-- ==============================================================================

-- Función Helper para chequear Admin (SECURITY DEFINER evita RLS loop)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin');
$$;

-- ==============================================================================
-- 4. FASE DE PROTECCIÓN (POLÍTICAS LIMPIAS)
-- ==============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;

-- 4.1 USUARIOS
-- Ver: Cada uno ve su perfil. Admin ve todos.
CREATE POLICY "users_select_clean" ON public.usuarios FOR SELECT 
USING (auth.uid() = id OR is_admin());

-- Editar: Cada uno edita su perfil. Admin edita todos.
CREATE POLICY "users_update_clean" ON public.usuarios FOR UPDATE 
USING (auth.uid() = id OR is_admin());

-- Crear: Cualquiera puede registrarse (necesario p/ Auth)
CREATE POLICY "users_insert_clean" ON public.usuarios FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4.2 PROYECTOS
-- Ver: Admin ve todo. Usuario ve si tiene membresía en el negocio o si el proyecto no tiene negocio (Legacy).
CREATE POLICY "projects_select_clean" ON public.projects FOR SELECT 
USING (
  is_admin() 
  OR 
  business_id IN (SELECT business_id FROM public.business_memberships WHERE user_id = auth.uid()) 
  OR 
  business_id IS NULL
);

-- Escribir: Solo Admin (por ahora, para simplificar)
CREATE POLICY "projects_all_admin" ON public.projects FOR ALL 
USING (is_admin());

-- 4.3 MEMBRESÍAS
CREATE POLICY "memberships_all_clean" ON public.business_memberships FOR ALL 
USING (is_admin() OR user_id = auth.uid());


-- ==============================================================================
-- 5. FASE DE RESTAURACIÓN DE TU ACCESO
-- ==============================================================================

UPDATE public.usuarios 
SET role = 'admin', permissions = '["super_admin", "all"]'::jsonb 
WHERE email ILIKE '%nicolasvitale8%';

UPDATE auth.users 
SET raw_app_meta_data = jsonb_build_object('role', 'admin') 
WHERE email ILIKE '%nicolasvitale8%';

SELECT '✅ RESET COMPLETADO. SISTEMA LIMPIO Y FUNCIONAL.' as status;
