-- ==========================================
-- MIGRACIÓN ACADEMIA OCTOPUS V2
-- ==========================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos ENUM (Opcional, se puede usar check constraints para mayor flexibilidad)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
        CREATE TYPE user_plan AS ENUM ('FREE', 'PRO');
    END IF;
END $$;

-- 3. Actualización de la tabla USUARIOS
-- Agregamos plan y scores para el motor de recomendaciones
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS plan user_plan DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS diagnostic_scores JSONB DEFAULT '{}'::jsonb;

-- 4. Actualización de la tabla RECURSOS_ACADEMIA
-- Agregamos metadatos para el sistema inteligente
ALTER TABLE public.recursos_academia
ADD COLUMN IF NOT EXISTS outcome TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'OPERACIONES',
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'VIDEO',
ADD COLUMN IF NOT EXISTS impact_tag TEXT DEFAULT 'HERRAMIENTA',
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS access TEXT DEFAULT 'PUBLIC',
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pinned_order INTEGER,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS action_steps TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pilares TEXT[] DEFAULT '{}';

-- 5. Creación de la tabla RUTAS_APRENDIZAJE
CREATE TABLE IF NOT EXISTS public.rutas_aprendizaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    audience TEXT DEFAULT 'DUENO',
    category TEXT DEFAULT 'OPERACIONES',
    estimated_minutes INTEGER DEFAULT 0,
    resource_ids UUID[] DEFAULT '{}',
    access TEXT DEFAULT 'PRO',
    "order" INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Políticas RLS para Rutas de Aprendizaje
ALTER TABLE public.rutas_aprendizaje ENABLE ROW LEVEL SECURITY;

-- Lectura pública para usuarios autenticados
CREATE POLICY "Rutas accesibles por todos" 
ON public.rutas_aprendizaje FOR SELECT 
USING (auth.role() = 'authenticated');

-- Gestión solo para admins
CREATE POLICY "Solo admins gestionan rutas" 
ON public.rutas_aprendizaje FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Comentarios para documentación
COMMENT ON TABLE public.rutas_aprendizaje IS 'Rutas de aprendizaje estructuradas de la Academia Octopus';
COMMENT ON COLUMN public.usuarios.diagnostic_scores IS 'Puntajes de diagnósticos (1-10) por categoría para recomendaciones';
