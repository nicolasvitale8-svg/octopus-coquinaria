-- 🔥 FIX_CREACION_USUARIOS.sql 🔥
-- Elimina la restricción que bloquea la creación de perfiles.

-- 1. Eliminar la restricción de clave foránea conflictiva
ALTER TABLE public.usuarios 
DROP CONSTRAINT IF EXISTS usuarios_id_fkey;

-- 2. Asegurar que el ID sea clave primaria
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_pkey') THEN
        ALTER TABLE public.usuarios ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 3. Limpiar registro previo para reintentar
DELETE FROM public.usuarios WHERE email = 'lascomidasdeaurora18@gmail.com';

SELECT 'LISTO' as status;
