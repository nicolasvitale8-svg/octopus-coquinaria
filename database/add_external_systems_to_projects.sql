-- AGREGAR COLUMNA DE SISTEMAS EXTERNOS
-- Guarda un array de objetos con info de acceso (url, user, pass_hint, etc.)
-- Usamos JSONB para flexibilidad (no necesitamos tabla relacional estricta para esto).

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS external_systems jsonb DEFAULT '[]'::jsonb;

-- Comentario para documentación
COMMENT ON COLUMN public.projects.external_systems IS 'Lista de accesos a sistemas externos (POS, ERP, etc.)';
