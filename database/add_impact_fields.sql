-- Add new URL and Impact fields to Academy Resources
ALTER TABLE public.recursos_academia
ADD COLUMN IF NOT EXISTS url_2 TEXT,
ADD COLUMN IF NOT EXISTS url_3 TEXT,
ADD COLUMN IF NOT EXISTS impact_outcome TEXT,
ADD COLUMN IF NOT EXISTS impact_format TEXT,
ADD COLUMN IF NOT EXISTS impact_program TEXT;

COMMENT ON COLUMN public.recursos_academia.url_2 IS 'Segunda URL opcional de descarga o recurso';
COMMENT ON COLUMN public.recursos_academia.url_3 IS 'Tercera URL opcional de descarga o recurso';
COMMENT ON COLUMN public.recursos_academia.impact_outcome IS 'Resultado esperado del impacto (Ej: Dominar costos)';
COMMENT ON COLUMN public.recursos_academia.impact_format IS 'Formato del impacto (Ej: Programa, Ruta)';
COMMENT ON COLUMN public.recursos_academia.impact_program IS 'Programa, Ruta o Sprint asociado al impacto';
