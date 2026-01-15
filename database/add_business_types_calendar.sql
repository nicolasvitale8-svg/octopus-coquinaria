-- Script para agregar columna business_types a eventos_calendario
-- Esta columna almacena los tipos de negocio objetivo para cada evento

ALTER TABLE eventos_calendario 
ADD COLUMN IF NOT EXISTS business_types TEXT[] 
DEFAULT ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO'];

-- Actualizar eventos existentes para tener todos los tipos (evento general)
UPDATE eventos_calendario 
SET business_types = ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']
WHERE business_types IS NULL;

-- Comentario para referencia
COMMENT ON COLUMN eventos_calendario.business_types IS 
'Tipos de negocio objetivo para este evento. Si contiene todos los tipos, es un evento general.';
