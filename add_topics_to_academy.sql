-- AGREGAR COLUMNA DE RUBROS (TOPICS) A ACADEMIA
-- Ejecuta esto en Supabase > SQL Editor

ALTER TABLE public.recursos_academia 
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Actualizar recursos existentes con un valor por defecto
UPDATE public.recursos_academia 
SET topics = '{finanzas}' 
WHERE titulo ILIKE '%Costo%';

UPDATE public.recursos_academia 
SET topics = '{operaciones,equipo}' 
WHERE titulo ILIKE '%Checklist%';
