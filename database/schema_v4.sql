-- ==============================================================================
-- 🐙 OCTOPUS V4: COLLABORATION & TASKS SCHEMA
-- Includes: Roles, Permissions, Specialties, Tasks, and Deliverables
-- ==============================================================================

-- 1. EXTENSIÓN DE ROLES Y PERMISOS (RBAC)
-- ------------------------------------------------------------------------------

-- Tabla de Roles Core
CREATE TABLE IF NOT EXISTS public.roles (
    id text PRIMARY KEY, -- 'admin', 'project_lead', 'consultant', 'client'
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Tabla de Permisos Atómicos
CREATE TABLE IF NOT EXISTS public.permissions (
    id text PRIMARY KEY, -- 'tasks_create', 'finance_view', etc.
    name text NOT NULL,
    module text, -- 'tasks', 'projects', 'crm', 'finance'
    created_at timestamptz DEFAULT now()
);

-- Relación Rol-Permiso
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id text REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id text REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Etiquetas de Especialidad (7P)
CREATE TABLE IF NOT EXISTS public.specialties (
    id text PRIMARY KEY, -- 'procesos', 'menu', 'costos', etc.
    name text NOT NULL,
    color text
);

-- 2. GESTIÓN DE MIEMBROS POR PROYECTO
-- ------------------------------------------------------------------------------

-- Tabla de Miembros (Reemplaza conceptualmente a business_memberships para mayor granularidad)
CREATE TABLE IF NOT EXISTS public.project_members (
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    role_id text REFERENCES public.roles(id),
    specialties jsonb DEFAULT '[]'::jsonb, -- Array de IDs de specialties
    permissions_override jsonb DEFAULT '[]'::jsonb, -- Permisos extra para este usuario en este proyecto
    is_active boolean DEFAULT true,
    joined_at timestamptz DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- 3. SISTEMA DE TAREAS Y ENTREGABLES
-- ------------------------------------------------------------------------------

-- Tabla de Tareas
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    type text NOT NULL CHECK (type IN ('INTERNAL', 'CLIENT', 'APPROVAL', 'REQUEST')),
    status text NOT NULL DEFAULT 'TODO', -- TODO, DOING, BLOCKED, DONE, PENDING, IN_REVIEW, APPROVED, REJECTED
    priority text DEFAULT 'medium', -- low, medium, high, urgent
    due_date date,
    created_by uuid REFERENCES public.usuarios(id),
    assigned_to uuid REFERENCES public.usuarios(id),
    visibility text DEFAULT 'SHARED' CHECK (visibility IN ('INTERNAL_ONLY', 'SHARED', 'CLIENT_ONLY')),
    attachments jsonb DEFAULT '[]'::jsonb,
    comments_count int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabla de Entregables
CREATE TABLE IF NOT EXISTS public.deliverables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    title text NOT NULL,
    file_url text,
    version text DEFAULT '1.0',
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
    assigned_approver uuid REFERENCES public.usuarios(id),
    internal_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabla de Bitácora / Notas del Proyecto
CREATE TABLE IF NOT EXISTS public.project_notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.usuarios(id) ON DELETE CASCADE,
    content text NOT NULL,
    category text DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'UPDATE', 'ALERT', 'MEETING', 'INTERNAL')),
    visibility text DEFAULT 'INTERNAL' CHECK (visibility IN ('INTERNAL', 'CLIENT_SHARED')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_visibility_policy" ON public.project_notes;
CREATE POLICY "notes_visibility_policy" ON public.project_notes FOR SELECT
USING (
    public.is_admin_or_consultant()
    OR
    (visibility = 'CLIENT_SHARED' AND public.is_member_of_project(project_id))
);

DROP POLICY IF EXISTS "notes_insert_policy" ON public.project_notes;
CREATE POLICY "notes_insert_policy" ON public.project_notes FOR INSERT
WITH CHECK (public.is_admin_or_consultant());

-- 4. BOOTSTRAP DE DATOS
-- ------------------------------------------------------------------------------

-- Roles Core
INSERT INTO public.roles (id, name, description) VALUES
('admin', 'Administrador', 'Acceso total al sistema'),
('project_lead', 'Líder de Proyecto', 'Gestiona miembros y tareas del proyecto'),
('consultant', 'Consultor', 'Ejecuta tareas y sube entregables'),
('client', 'Cliente / Propietario', 'Realiza tareas de cliente y aprueba entregables')
ON CONFLICT (id) DO NOTHING;

-- Especialidades (Chips 7P)
INSERT INTO public.specialties (id, name) VALUES
('procesos', 'Orden / Procesos'),
('menu', 'Creatividad / Menú'),
('tech', 'Tecnología / IA'),
('audit', 'Observación / Auditoría'),
('costos', 'Pragmatismo / Costos'),
('capacitacion', 'Capacitación / Escalado'),
('experiencia', 'Servicio / Experiencia')
ON CONFLICT (id) DO NOTHING;

-- 5. FUNCIONES DE SEGURIDAD V4
-- ------------------------------------------------------------------------------

-- Helper: Obtener rol del usuario actual (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- Helper: ¿Es Super Admin? (Robust check)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- 1. Failsafe por email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email = 'nicolasvitale8@gmail.com' THEN RETURN TRUE; END IF;

    -- 2. Por tabla usuarios (Security Definer ignora RLS)
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    RETURN (user_role = 'admin');
END;
$$;

-- Helper: ¿Es Admin o Consultor? (Robust check)
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- 1. Failsafe por email
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email = 'nicolasvitale8@gmail.com' THEN RETURN TRUE; END IF;

    -- 2. Por tabla usuarios (Security Definer ignora RLS)
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    RETURN (user_role IN ('admin', 'consultant'));
END;
$$;

-- Helper: ¿Es miembro de un proyecto? (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.is_member_of_project(pid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = pid AND user_id = auth.uid()
  );
$$;

-- Función para verificar permisos combinando Rol Global y Rol por Proyecto
CREATE OR REPLACE FUNCTION public.can_do(action_perm text, pid uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    has_globally boolean;
    has_in_project boolean;
BEGIN
    -- 1. Obtener rol global
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    
    -- 2. Si es admin global, siempre puede
    IF user_role = 'admin' THEN RETURN TRUE; END IF;

    -- 3. Verificar permiso a través del rol global
    SELECT EXISTS (
        SELECT 1 FROM role_permissions rp 
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = user_role AND p.id = action_perm
    ) INTO has_globally;

    IF has_globally THEN RETURN TRUE; END IF;

    -- 4. Si se provee proyecto, verificar rol/overrides en el proyecto
    IF pid IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM project_members pm
            LEFT JOIN role_permissions rp ON pm.role_id = rp.role_id
            WHERE pm.user_id = auth.uid() 
            AND pm.project_id = pid
            AND (rp.permission_id = action_perm OR pm.permissions_override ? action_perm)
        ) INTO has_in_project;
        
        RETURN has_in_project;
    END IF;

    RETURN FALSE;
END;
$$;

-- 6. POLÍTICAS RLS (VISTA PREVIA)
-- ------------------------------------------------------------------------------

-- Tareas: Visibilidad según columna 'visibility' y pertenencia al proyecto
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_visibility_policy" ON public.tasks;
CREATE POLICY "task_visibility_policy" ON public.tasks FOR SELECT
USING (
    public.is_super_admin()
    OR
    (
        public.is_member_of_project(project_id)
        AND
        (
            (visibility = 'INTERNAL_ONLY' AND (SELECT role FROM usuarios WHERE id = auth.uid()) != 'client')
            OR
            (visibility = 'SHARED')
            OR
            (visibility = 'CLIENT_ONLY' AND (auth.uid() = assigned_to OR auth.uid() = created_by))
        )
    )
);

DROP POLICY IF EXISTS "task_insert_policy" ON public.tasks;
CREATE POLICY "task_insert_policy" ON public.tasks FOR ALL
WITH CHECK (public.is_admin_or_consultant());

-- Entregables: Solo miembros del proyecto y admins
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deliverable_visibility_policy" ON public.deliverables;
CREATE POLICY "deliverable_visibility_policy" ON public.deliverables FOR SELECT
USING (
    public.is_super_admin()
    OR
    public.is_member_of_project(project_id)
);

DROP POLICY IF EXISTS "deliverable_management_policy" ON public.deliverables;
CREATE POLICY "deliverable_management_policy" ON public.deliverables FOR ALL
WITH CHECK (public.is_admin_or_consultant());

-- Miembros del Proyecto: Admin ve todo, usuarios ven sus proyectos
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_visibility_policy" ON public.project_members;
CREATE POLICY "member_visibility_policy" ON public.project_members FOR SELECT
USING (
    public.is_super_admin()
    OR
    auth.uid() = user_id -- Ver su propia membresía
    OR
    public.is_member_of_project(project_id) -- Ver miembros de su mismo proyecto
);

DROP POLICY IF EXISTS "member_management_policy" ON public.project_members;
CREATE POLICY "member_management_policy" ON public.project_members FOR ALL
WITH CHECK (public.is_super_admin());

-- Tablas de Configuración (Lectura para todos, Escritura solo Admin)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_roles" ON public.roles;
CREATE POLICY "read_all_roles" ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "admin_all_roles" ON public.roles;
CREATE POLICY "admin_all_roles" ON public.roles FOR ALL WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "read_all_permissions" ON public.permissions;
CREATE POLICY "read_all_permissions" ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "admin_all_permissions" ON public.permissions;
CREATE POLICY "admin_all_permissions" ON public.permissions FOR ALL WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "read_all_specialties" ON public.specialties;
CREATE POLICY "read_all_specialties" ON public.specialties FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "admin_all_specialties" ON public.specialties;
CREATE POLICY "admin_all_specialties" ON public.specialties FOR ALL WITH CHECK (public.is_super_admin());

-- Usuarios: Solo Admin o el propio usuario
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "v4_usuarios_select" ON public.usuarios;
CREATE POLICY "v4_usuarios_select" ON public.usuarios FOR SELECT USING (true);

DROP POLICY IF EXISTS "v4_usuarios_insert" ON public.usuarios;
CREATE POLICY "v4_usuarios_insert" ON public.usuarios FOR INSERT WITH CHECK (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "v4_usuarios_update" ON public.usuarios;
CREATE POLICY "v4_usuarios_update" ON public.usuarios FOR UPDATE 
USING (auth.uid() = id OR public.is_super_admin())
WITH CHECK (auth.uid() = id OR public.is_super_admin());

DROP POLICY IF EXISTS "v4_usuarios_delete" ON public.usuarios;
CREATE POLICY "v4_usuarios_delete" ON public.usuarios FOR DELETE USING (public.is_super_admin());

-- Negocios / Sedes: Visibilidad según membresía
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "business_visibility_policy" ON public.businesses;
CREATE POLICY "business_visibility_policy" ON public.businesses FOR SELECT
USING (
    public.is_super_admin()
    OR
    EXISTS (SELECT 1 FROM projects p WHERE p.business_name = businesses.name) -- Placeholder simple
);

SELECT '✅ ESQUEMA V4 PREPARADO. Listo para migración de datos y lógica.' as status;
