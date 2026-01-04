
-- 1. Actualización de Usuarios (Plan y Diagnóstico)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
        CREATE TYPE user_plan AS ENUM ('FREE', 'PRO');
    END IF;
END $$;

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS plan user_plan DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS diagnostic_scores JSONB DEFAULT '{}'::jsonb;

-- 2. Actualización de Recursos (Metadatos de Consultoría)
ALTER TABLE public.recursos_academia
ADD COLUMN IF NOT EXISTS outcome TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS format TEXT,
ADD COLUMN IF NOT EXISTS impact_tag TEXT,
ADD COLUMN IF NOT EXISTS level SMALLINT DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 3. Creación de Tabla de Rutas de Aprendizaje
CREATE TABLE IF NOT EXISTS public.rutas_aprendizaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    audience TEXT, -- DUENO | ENCARGADO | PRODUCCION | APERTURA
    category TEXT, -- COSTOS | OPERACIONES | EQUIPO | MARKETING | TECNOLOGIA | CLIENTE
    estimated_minutes INTEGER DEFAULT 0,
    resource_ids UUID[] DEFAULT '{}',
    access TEXT DEFAULT 'PRO', -- PUBLIC | PRO
    "order" INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Habilitar RLS para la nueva tabla
ALTER TABLE public.rutas_aprendizaje ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos
CREATE POLICY "Permitir lectura publica de rutas" 
ON public.rutas_aprendizaje FOR SELECT 
USING (true);

-- Política de inserción/actualización para admins
CREATE POLICY "Permitir gestion a admins y consultores" 
ON public.rutas_aprendizaje FOR ALL
USING (public.is_admin_or_consultant());

-- 5. Comentario de documentación
COMMENT ON TABLE public.rutas_aprendizaje IS 'Rutas de aprendizaje estructuradas de la Academia Octopus.';
