-- SOLUCIÓN FINAL ACADEMIA
-- 1. Agrega la columna 'topics' que faltaba para los filtros.
-- 2. Borra TODOS los recursos viejos (demos) para empezar de cero.

-- Paso 1: Agregar columna de rubros (topics) si no existe
ALTER TABLE public.recursos_academia 
ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Paso 2: Limpiar la tabla completa (Borrar demos)
TRUNCATE TABLE public.recursos_academia;

-- Confirmación visual
SELECT 'Tabla limpiada y columna topics agregada.' as resultado;
