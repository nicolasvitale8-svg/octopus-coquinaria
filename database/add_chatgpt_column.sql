-- Agrega la columna chatgpt_url a la tabla projects si no existe
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS chatgpt_url TEXT;

-- Mensaje de confirmación
SELECT 'Columna chatgpt_url agregada correctamente' as resultado;
