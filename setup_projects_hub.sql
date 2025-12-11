-- ==============================================================================
-- SETUP PROYECTOS HUB (OCTOPUS WRAPPER FOR NOTION)
-- ==============================================================================

-- 1. Tabla de Proyectos
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Relación con Lead (Opcional, puede ser un proyecto sin lead previo)
    lead_id UUID REFERENCES public.diagnosticos_express(id) ON DELETE SET NULL,
    
    -- Datos Básicos
    business_name TEXT NOT NULL,
    main_service TEXT, -- 'Orden', 'Control', 'Carta', 'Acompañamiento 360'
    lead_consultant TEXT,
    
    -- Estado y Fase
    phase TEXT DEFAULT 'Lead', -- 'Lead', 'Onboarding', 'Diagnóstico', 'Implementación', 'Seguimiento', 'Cerrado'
    status TEXT DEFAULT 'verde', -- 'verde', 'amarillo', 'rojo'
    
    -- Próxima Acción (Top Level)
    next_action TEXT,
    next_action_date DATE,
    
    -- Integraciones
    notion_url TEXT,
    
    -- Detalle (JSONB para flexibilidad sin sobre-ingeniería)
    -- summary: { objective: '', problem: '', pillars: [] }
    summary JSONB DEFAULT '{}'::jsonb,
    
    -- team: { consultants: [], client_rep: '', roles: [] }
    team JSONB DEFAULT '{}'::jsonb,
    
    -- milestones: [{ name: 'Kickoff', date: '', status: 'pending', note: '' }]
    milestones JSONB DEFAULT '[]'::jsonb,
    
    -- activity: [{ date: '', text: '', author: '' }]
    activity_log JSONB DEFAULT '[]'::jsonb
);

-- 2. RLS Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin projects full" ON public.projects;
DROP POLICY IF EXISTS "User projects read" ON public.projects;

-- Admin: Full Access (usando la función is_admin() que ya arreglamos)
CREATE POLICY "Admin projects full" ON public.projects
FOR ALL TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

-- 3. Trigger opcional para update automático de 'updated_at' (si existiera)
-- No necesario por ahora.

-- 4. Notificamos al usuario
SELECT 'Tabla projects creada correctamente.' as result;
