-- ==============================================================================
-- 🐙 OCTOPUS COQUINARIA - MASTER SCHEMA
-- Versión: 2026-01-12
-- Consolidado de: schema_v4.sql + v3_security_implementation.sql + finanzaflow_schema.sql
-- ==============================================================================
-- 
-- INSTRUCCIONES:
-- 1. Este archivo es la FUENTE DE VERDAD para el esquema de la base de datos
-- 2. NO ejecutar en producción sin backup previo
-- 3. Para desarrollo/staging, ejecutar este script completo
-- 4. Scripts históricos archivados en: database/_archive/
--
-- ==============================================================================

-- ============================================================================
-- SECCIÓN 1: TABLAS BASE (CORE)
-- ============================================================================

-- 1.1 Tabla Usuarios (Core de Autenticación)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    business_name TEXT,
    plan TEXT DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PRO')),
    role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'consultant', 'manager', 'client', 'user')),
    permissions JSONB DEFAULT '[]'::jsonb,
    diagnostic_scores JSONB DEFAULT '{}'::jsonb,
    job_title TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Tabla Negocios (Businesses)
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 1.3 Tabla Business Memberships (Vínculo Usuario-Negocio)
CREATE TABLE IF NOT EXISTS public.business_memberships (
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    member_role TEXT DEFAULT 'manager',
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (business_id, user_id)
);

-- 1.4 Tabla Proyectos
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    lead_id UUID REFERENCES public.diagnosticos_express(id),
    business_id UUID REFERENCES public.businesses(id),
    business_name TEXT NOT NULL,
    main_service TEXT,
    lead_consultant TEXT,
    phase TEXT DEFAULT 'Lead' CHECK (phase IN ('Lead', 'Onboarding', 'Diagnóstico', 'Implementación', 'Seguimiento', 'Cerrado')),
    status TEXT DEFAULT 'verde' CHECK (status IN ('verde', 'amarillo', 'rojo')),
    next_action TEXT,
    next_action_date DATE,
    notion_url TEXT,
    chatgpt_url TEXT,
    drive_url TEXT,
    finanzaflow_enabled BOOLEAN DEFAULT false,
    external_systems JSONB DEFAULT '[]'::jsonb,
    summary JSONB DEFAULT '{}'::jsonb,
    team JSONB DEFAULT '{}'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    activity_log JSONB DEFAULT '[]'::jsonb
);

-- ============================================================================
-- SECCIÓN 2: TABLAS V4 (COLLABORATION & TASKS)
-- ============================================================================

-- 2.1 Roles Core
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 Permisos Atómicos
CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    module TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Relación Rol-Permiso
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id TEXT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2.4 Especialidades (7P)
CREATE TABLE IF NOT EXISTS public.specialties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT
);

-- 2.5 Miembros de Proyecto
CREATE TABLE IF NOT EXISTS public.project_members (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    role_id TEXT REFERENCES public.roles(id),
    specialties JSONB DEFAULT '[]'::jsonb,
    permissions_override JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (project_id, user_id)
);

-- 2.6 Tareas
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('INTERNAL', 'CLIENT', 'APPROVAL', 'REQUEST')),
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT DEFAULT 'medium',
    due_date DATE,
    created_by UUID REFERENCES public.usuarios(id),
    assigned_to UUID REFERENCES public.usuarios(id),
    visibility TEXT DEFAULT 'SHARED' CHECK (visibility IN ('INTERNAL_ONLY', 'SHARED', 'CLIENT_ONLY')),
    attachments JSONB DEFAULT '[]'::jsonb,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Entregables
CREATE TABLE IF NOT EXISTS public.deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
    assigned_approver UUID REFERENCES public.usuarios(id),
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.8 Notas de Proyecto
CREATE TABLE IF NOT EXISTS public.project_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'GENERAL' CHECK (category IN ('GENERAL', 'UPDATE', 'ALERT', 'MEETING', 'INTERNAL')),
    visibility TEXT DEFAULT 'INTERNAL' CHECK (visibility IN ('INTERNAL', 'CLIENT_SHARED')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECCIÓN 3: TABLAS CRM & ACADEMIA
-- ============================================================================

-- 3.1 Diagnósticos Express (Leads)
CREATE TABLE IF NOT EXISTS public.diagnosticos_express (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    business_name TEXT,
    business_type TEXT,
    city TEXT,
    monthly_revenue NUMERIC,
    status TEXT DEFAULT 'nuevo',
    score_global NUMERIC,
    result_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.2 Recursos Academia
CREATE TABLE IF NOT EXISTS public.recursos_academia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    outcome TEXT,
    category TEXT,
    format TEXT,
    impact_tag TEXT,
    level INTEGER DEFAULT 1,
    duration_minutes INTEGER,
    access TEXT DEFAULT 'FREE',
    is_pinned BOOLEAN DEFAULT false,
    pinned_order INTEGER,
    expires_at TIMESTAMPTZ,
    download_url TEXT,
    url2 TEXT,
    url3 TEXT,
    youtube_id TEXT,
    action_steps JSONB,
    ideal_for JSONB,
    pilares JSONB,
    impact_outcome TEXT,
    impact_format TEXT,
    impact_program TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.3 Eventos Calendario
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    all_day BOOLEAN DEFAULT false,
    type TEXT,
    project_id UUID REFERENCES public.projects(id),
    business_id UUID REFERENCES public.businesses(id),
    created_by UUID REFERENCES public.usuarios(id),
    attendees JSONB,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3.4 Pizarra Pública (News Board)
CREATE TABLE IF NOT EXISTS public.pizarra_publica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('TIP', 'DESCUENTO', 'NOVEDAD_APP', 'RADAR')),
    summary TEXT,
    start_date DATE,
    end_date DATE,
    priority INTEGER DEFAULT 2,
    is_visible BOOLEAN DEFAULT true,
    cta_label TEXT,
    cta_url TEXT,
    tag TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECCIÓN 4: TABLAS FINANZAFLOW
-- ============================================================================

-- 4.1 Tipos de Cuenta
CREATE TABLE IF NOT EXISTS public.fin_account_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    include_in_cashflow BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Cuentas
CREATE TABLE IF NOT EXISTS public.fin_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    account_type_id TEXT REFERENCES public.fin_account_types(id),
    currency TEXT DEFAULT 'ARS',
    is_active BOOLEAN DEFAULT true,
    credit_limit NUMERIC(15,2),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 Categorías
CREATE TABLE IF NOT EXISTS public.fin_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('IN', 'OUT', 'MIX')),
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4 Subcategorías
CREATE TABLE IF NOT EXISTS public.fin_subcategories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category_id TEXT REFERENCES public.fin_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 Balances Mensuales
CREATE TABLE IF NOT EXISTS public.fin_monthly_balances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT REFERENCES public.fin_accounts(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(account_id, year, month)
);

-- 4.6 Transacciones
CREATE TABLE IF NOT EXISTS public.fin_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE NOT NULL,
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    description TEXT,
    note TEXT,
    amount NUMERIC(15,2) NOT NULL,
    type TEXT CHECK (type IN ('IN', 'OUT')),
    account_id TEXT REFERENCES public.fin_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 Items de Presupuesto
CREATE TABLE IF NOT EXISTS public.fin_budget_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    label TEXT,
    type TEXT CHECK (type IN ('IN', 'OUT')),
    planned_amount NUMERIC(15,2) NOT NULL,
    planned_date INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    total_installments INTEGER,
    current_installment INTEGER,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.8 Plazos Fijos (Jars)
CREATE TABLE IF NOT EXISTS public.fin_jars (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT REFERENCES public.fin_accounts(id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    principal NUMERIC(15,2) NOT NULL,
    annual_rate NUMERIC(10,4) NOT NULL,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.9 Cheques
CREATE TABLE IF NOT EXISTS public.finance_cheques (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    cheque_number TEXT,
    bank TEXT,
    amount NUMERIC(15,2) NOT NULL,
    issue_date DATE,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'cashed', 'rejected', 'cancelled')),
    type TEXT CHECK (type IN ('received', 'issued')),
    payer_payee TEXT,
    notes TEXT,
    project_id UUID REFERENCES public.projects(id),
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.10 Reglas de Categorización
CREATE TABLE IF NOT EXISTS public.fin_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pattern TEXT NOT NULL,
    match_type TEXT CHECK (match_type IN ('contains', 'equals', 'startsWith')),
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    direction TEXT CHECK (direction IN ('IN', 'OUT')),
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECCIÓN 5: FUNCIONES DE SEGURIDAD
-- ============================================================================

-- 5.1 Obtener rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 5.2 ¿Es Super Admin?
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email = 'nicolasvitale8@gmail.com' THEN RETURN TRUE; END IF;
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    RETURN (user_role = 'admin');
END;
$$;

-- 5.3 ¿Es Admin o Consultor?
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email = 'nicolasvitale8@gmail.com' THEN RETURN TRUE; END IF;
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    RETURN (user_role IN ('admin', 'consultant'));
END;
$$;

-- 5.4 ¿Es miembro de un proyecto?
CREATE OR REPLACE FUNCTION public.is_member_of_project(pid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = pid AND user_id = auth.uid()
  );
$$;

-- 5.5 Acceso a datos financieros
CREATE OR REPLACE FUNCTION public.can_access_fin_data(target_user_id UUID, target_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.uid() = target_user_id
        OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR (
            target_business_id IS NOT NULL 
            AND EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = target_business_id AND user_id = auth.uid())
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECCIÓN 6: DATOS INICIALES (BOOTSTRAP)
-- ============================================================================

-- Roles Core
INSERT INTO public.roles (id, name, description) VALUES
('admin', 'Administrador', 'Acceso total al sistema'),
('project_lead', 'Líder de Proyecto', 'Gestiona miembros y tareas del proyecto'),
('consultant', 'Consultor', 'Ejecuta tareas y sube entregables'),
('client', 'Cliente / Propietario', 'Realiza tareas de cliente y aprueba entregables')
ON CONFLICT (id) DO NOTHING;

-- Especialidades (7P)
INSERT INTO public.specialties (id, name) VALUES
('procesos', 'Orden / Procesos'),
('menu', 'Creatividad / Menú'),
('tech', 'Tecnología / IA'),
('audit', 'Observación / Auditoría'),
('costos', 'Pragmatismo / Costos'),
('capacitacion', 'Capacitación / Escalado'),
('experiencia', 'Servicio / Experiencia')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECCIÓN 7: RLS (ROW LEVEL SECURITY) - Ver archivo RLS_POLICIES.sql
-- ============================================================================
-- Las políticas RLS se mantienen en un archivo separado para mayor claridad.
-- Ejecutar: database/RLS_POLICIES.sql después de este script.

SELECT '✅ MASTER SCHEMA CARGADO CORRECTAMENTE' as status;
