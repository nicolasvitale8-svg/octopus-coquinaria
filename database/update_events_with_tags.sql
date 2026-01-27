-- ===========================================
-- ACTUALIZAR EVENTOS EXISTENTES CON TAGS
-- Ejecutar DESPUÉS de add_tags_calendar.sql
-- ===========================================

-- Cierres de mes → ['GESTION_FINANZAS', 'GESTION_OPERACION']
UPDATE eventos_calendario 
SET tags = ARRAY['GESTION_FINANZAS', 'GESTION_OPERACION']
WHERE titulo LIKE '%Cierre de Mes%';

-- Mantenimiento preventivo equipos de frío → ['GESTION_MANTENIMIENTO']
UPDATE eventos_calendario 
SET tags = ARRAY['GESTION_MANTENIMIENTO']
WHERE titulo LIKE '%Mantenimiento Preventivo%Frío%';

-- Mantenimiento preventivo equipos de calor → ['GESTION_MANTENIMIENTO']
UPDATE eventos_calendario 
SET tags = ARRAY['GESTION_MANTENIMIENTO']
WHERE titulo LIKE '%Mantenimiento Preventivo%Calor%';

-- Cartas de temporada → ['GESTION_PRODUCTO', 'GESTION_OPERACION']
UPDATE eventos_calendario 
SET tags = ARRAY['GESTION_PRODUCTO', 'GESTION_OPERACION']
WHERE titulo LIKE '%Carta de%Planificación%';

-- Verificar resultados
SELECT titulo, tipo, tags FROM eventos_calendario WHERE tags IS NOT NULL AND array_length(tags, 1) > 0 LIMIT 20;
