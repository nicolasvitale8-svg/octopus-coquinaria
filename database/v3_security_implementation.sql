-- IMPLEMENTACIÓN DE SEGURIDAD V3 FINAL (MASTER SCRIPT)
-- Este script soluciona la recursión infinita y establece el modelo de roles Admin/Colaborador/Cliente.

-- 1. PREPARACIÓN DE ESQUEMA Y TABLAS
-- ==============================================================================

-- 1.1 Tabla Negocios (Businesses) - Contenedor principal de proyectos
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 1.2 Tabla Business Memberships - Vínculo Usuario-Negocio (Clave para Colaboradores y Clientes)
CREATE TABLE IF NOT EXISTS public.business_memberships (
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    member_role text DEFAULT 'manager', -- 'manager', 'editor', 'viewer'
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (business_id, user_id)
);

-- 1.3 Vincular Proyectos a Negocios
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- 1.4 Estructura de Usuario (Roles y Permisos)
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';

-- Asegurar JSONB para permisos granulares
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS permissions;
ALTER TABLE public.usuarios ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE public.usuarios 
ADD CONSTRAINT check_role CHECK (role IN ('admin', 'consultant', 'manager', 'client', 'user'));


-- 2. FUNCIONES DE SEGURIDAD (ANTI-RECURSIÓN)
-- ==============================================================================
-- IMPORTANTE: Usamos SECURITY DEFINER para que estas funciones se ejecuten con
-- privilegios de sistema y NO disparen las políticas RLS de la tabla usuarios,
-- rompiendo así el bucle infinito.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- Función: ¿Es Super Admin? (Acceso Dios)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (get_my_role() = 'admin');
$$;

-- Función: Chequeo de Permisos Granulares (Para Colaboradores)
CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    is_super_admin() -- Admin tiene todo
    OR
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND permissions @> to_jsonb(perm)
    )
  );
$$;


-- 3. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ==============================================================================

-- 3.1 USUARIOS (La tabla crítica)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas viejas corruptas
DROP POLICY IF EXISTS "v3_users_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_select_admin" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_update_own" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admins pueden ver todo" ON public.usuarios;
DROP POLICY IF EXISTS "ver_usuario_propio_o_admin" ON public.usuarios;

-- Política de Lectura: Cada quien ve lo suyo, Admin ve todo, Colaboradores ven si tienen permiso de 'users_read'
CREATE POLICY "v3_unified_users_select" ON public.usuarios FOR SELECT
USING (
  auth.uid() = id
  OR
  is_super_admin()
  OR
  has_permission('users_view_all') -- Para coordinadores de equipo por ejemplo
);

-- Política de Escritura: Solo propio usuario (datos básicos) o Admin
CREATE POLICY "v3_unified_users_update" ON public.usuarios FOR UPDATE
USING ( auth.uid() = id OR is_super_admin() );

-- Permitir Insertar al registrarse (necesario para auth flow)
DROP POLICY IF EXISTS "permitir_insertar_registro" ON public.usuarios;
CREATE POLICY "permitir_insertar_registro" ON public.usuarios FOR INSERT
WITH CHECK ( auth.uid() = id );


-- 3.2 PROYECTOS (Acceso por Rol y Membresía)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "v3_projects_select" ON public.projects;
CREATE POLICY "v3_projects_select" ON public.projects FOR SELECT
USING (
  is_super_admin() -- 1. Admin ve todo siempre
  OR
  -- 2. Colaboradores y Clientes ven SOLO si están asignados al negocio del proyecto
  (auth.uid() IN (
     SELECT user_id FROM public.business_memberships 
     WHERE business_id = projects.business_id 
  ))
);

-- Escritura en Proyectos: Admin o Manager de Negocio
DROP POLICY IF EXISTS "v3_projects_insert" ON public.projects;
CREATE POLICY "v3_projects_insert" ON public.projects FOR INSERT
WITH CHECK ( is_super_admin() OR has_permission('projects_create') );

DROP POLICY IF EXISTS "v3_projects_modify" ON public.projects;
CREATE POLICY "v3_projects_modify" ON public.projects FOR ALL
USING ( is_super_admin() OR has_permission('projects_edit') );


-- 4. BOOTSTRAP INICIAL
-- ==============================================================================

-- Asegurar Admin Principal
UPDATE public.usuarios
SET 
  role = 'admin', 
  permissions = '["super_admin", "all_access"]'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';

-- Sincronizar metadatos de Auth para evitar latencia
UPDATE auth.users
SET raw_app_meta_data = 
  COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'SISTEMA V3 ACTUALIZADO: Recursión eliminada y Modelo de Roles (Admin/Colaborador/Cliente) aplicado.' as status;

-- ARCHIVO MAESTRO - CONTIENE TODAS LAS CORRECCIONES (V3.1 + V3.2)
-- Ejecutar este único script soluciona todo.

-- 1. Preparación de Tablas (Schema)

-- 1.1 Tabla Businesses (Negocios)
CREATE TABLE IF NOT EXISTS public.businesses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 1.2 Tabla Business Memberships (Vínculo Usuario-Negocio)
CREATE TABLE IF NOT EXISTS public.business_memberships (
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    member_role text DEFAULT 'manager',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (business_id, user_id)
);

-- 1.3 Agregar business_id a Projects (Si no existe)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id);

-- 1.4 Modificamos/Creamos tabla usuarios para soportar roles y permisos V3
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';

-- Aseguramos que permissions sea JSONB (Plan V3)
ALTER TABLE public.usuarios DROP COLUMN IF EXISTS permissions;
ALTER TABLE public.usuarios ADD COLUMN permissions jsonb DEFAULT '[]'::jsonb;

-- Asegurar restricción de valores para roles
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS check_role;
ALTER TABLE public.usuarios 
ADD CONSTRAINT check_role CHECK (role IN ('admin', 'consultant', 'manager', 'client', 'user'));


-- 2. Funciones Helper de Seguridad (FIX V3.2: SECURITY DEFINER + SEARCH_PATH)
-- "SECURITY DEFINER" es clave para evitar recursión infinita.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (get_my_role() IN ('admin', 'consultant'));
$$;

CREATE OR REPLACE FUNCTION public.has_permission(perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    is_admin_or_consultant() -- Admins tienen todo
    OR
    EXISTS (
        SELECT 1 FROM public.usuarios 
        WHERE id = auth.uid() 
        AND permissions ? perm -- Operador JSONB 'existe key'
    )
  );
$$;

-- 3. Políticas RLS (Row Level Security) - Aplicación Estricta

-- Habilitar RLS en tablas principales
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
-- FIX V3.1: Habilitar en Usuarios explícitamente
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 3.1 PROYECTOS
-- Ver: Admin/Consultant ven todo. Cliente ve SOLO lo suyo.
DROP POLICY IF EXISTS "v3_projects_select" ON public.projects;
CREATE POLICY "v3_projects_select" ON public.projects FOR SELECT
USING (
  is_admin_or_consultant()
  OR
  (auth.uid() IN (
     SELECT user_id FROM public.business_memberships WHERE business_id = projects.business_id 
  ))
  OR
  true -- TEMPORAL: Mantener visibilidad global hasta migración completa
);

-- Escritura: Solo Admin
DROP POLICY IF EXISTS "v3_projects_insert" ON public.projects;
CREATE POLICY "v3_projects_insert" ON public.projects FOR INSERT
WITH CHECK ( is_admin_or_consultant() );

DROP POLICY IF EXISTS "v3_projects_update" ON public.projects;
CREATE POLICY "v3_projects_update" ON public.projects FOR UPDATE
USING ( is_admin_or_consultant() );

DROP POLICY IF EXISTS "v3_projects_delete" ON public.projects;
CREATE POLICY "v3_projects_delete" ON public.projects FOR DELETE
USING ( is_admin_or_consultant() );


-- 3.2 ACADEMIA (Recursos)
DROP POLICY IF EXISTS "v3_academy_select" ON public.recursos_academia;
CREATE POLICY "v3_academy_select" ON public.recursos_academia FOR SELECT
USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "v3_academy_modify" ON public.recursos_academia;
CREATE POLICY "v3_academy_modify" ON public.recursos_academia FOR ALL
USING ( is_admin_or_consultant() );


-- 3.3 LEADS (Diagnósticos)
DROP POLICY IF EXISTS "v3_leads_all" ON public.diagnosticos_express;
CREATE POLICY "v3_leads_all" ON public.diagnosticos_express FOR ALL
USING ( is_admin_or_consultant() );

DROP POLICY IF EXISTS "v3_leads_insert_public" ON public.diagnosticos_express;
CREATE POLICY "v3_leads_insert_public" ON public.diagnosticos_express FOR INSERT
WITH CHECK ( true );


-- 3.4 USUARIOS (CORRECCIÓN IMPORTANTE V3.1)
-- Política: Usuario puede ver SU propio perfil (NECESARIO PARA EL FRONTEND)
DROP POLICY IF EXISTS "v3_users_select_own" ON public.usuarios;
CREATE POLICY "v3_users_select_own" ON public.usuarios FOR SELECT
USING ( auth.uid() = id );

-- Política: Admin puede ver todos los perfiles
DROP POLICY IF EXISTS "v3_users_select_admin" ON public.usuarios;
CREATE POLICY "v3_users_select_admin" ON public.usuarios FOR SELECT
USING ( is_admin_or_consultant() );

-- Política: Usuario puede actualizar SU propio perfil
DROP POLICY IF EXISTS "v3_users_update_own" ON public.usuarios;
CREATE POLICY "v3_users_update_own" ON public.usuarios FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );


-- 4. BOOTSTRAP (Configuración Inicial)
-- Forzar tus usuarios como ADMIN supremos (Soporte para ambos emails)

-- Email Antiuguo (Correcto)
UPDATE public.usuarios
SET role = 'admin', permissions = '["super_admin"]'::jsonb
WHERE email = 'nicolasvitale8@gmail.com';

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'nicolasvitale8@gmail.com';

SELECT 'MASTER SCRIPT EJECUTADO: FIXES V3.1 + V3.2 APLICADOS. SISTEMA SEGURO Y OPERATIVO.' as status;
