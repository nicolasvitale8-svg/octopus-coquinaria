-- AGREGAR CAMPOS DE PERFIL EXTENDIDO
-- Este script añade columnas para guardar más información de los colaboradores.

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS job_title text,
ADD COLUMN IF NOT EXISTS notes text;

SELECT 'Campos phone, job_title y notes agregados a tabla usuarios.' as status;
