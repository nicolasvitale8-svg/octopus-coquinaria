-- ==========================================
-- FIX FINAL ESQUEMA ACADEMIA V2
-- ==========================================

-- 1. Agregar youtube_id (faltaba en la migración anterior)
ALTER TABLE public.recursos_academia 
ADD COLUMN IF NOT EXISTS youtube_id TEXT;

-- 2. Asegurar que 'tipo' (legacy) sea opcional para evitar errores al insertar V2
ALTER TABLE public.recursos_academia 
ALTER COLUMN tipo DROP NOT NULL;

-- 3. Asegurar que 'url' sea opcional (ahora preferimos campos específicos)
ALTER TABLE public.recursos_academia 
ALTER COLUMN url DROP NOT NULL;

-- 4. Renombrar o asegurar compatibilidad de columnas
-- (Si ya existen, no hace nada)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recursos_academia' AND column_name='titulo') THEN
        ALTER TABLE public.recursos_academia RENAME COLUMN title TO titulo;
    END IF;
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- 5. Sincronizar datos por si acaso (Mapear formato nuevo a tipo viejo para compatibilidad)
UPDATE public.recursos_academia 
SET tipo = lower(format)
WHERE tipo IS NULL AND format IS NOT NULL;

SELECT '✅ Esquema de Academia consolidado. youtube_id agregado y restricciones relajadas.' as status;
