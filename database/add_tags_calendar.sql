-- ===========================================
-- AGREGAR COLUMNA TAGS A EVENTOS_CALENDARIO
-- Ejecutar DESPUÉS de add_business_types_calendar.sql
-- ===========================================

-- Agregar columna tags (array de strings)
ALTER TABLE eventos_calendario 
ADD COLUMN IF NOT EXISTS tags TEXT[] 
DEFAULT ARRAY[]::TEXT[];

-- Comentario para referencia
COMMENT ON COLUMN eventos_calendario.tags IS 
'Tags de categorización del evento. Valores válidos: CLIMA, FERIADO, GESTION_FINANZAS, GESTION_OPERACION, GESTION_MANTENIMIENTO, GESTION_PRODUCTO, GESTION_EQUIPO, DEPORTES, EFEMERIDE_GASTRO, FIESTAS, MARKETING, TURISMO, OTRO. Max 3 por evento.';
