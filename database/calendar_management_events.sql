-- ===========================================
-- EVENTOS DE GESTIÓN INTERNOS - CALENDARIO OCTOPUS
-- Ejecutar después de add_business_types_calendar.sql
-- ===========================================

-- Primero, asegurar que la columna business_types existe
-- (Si ya ejecutaste add_business_types_calendar.sql, esto no hará nada)

-- ===========================================
-- 1. CIERRE DE MES - Inventario y Estado de Resultado (12 eventos)
-- ===========================================

INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
-- 2025
(gen_random_uuid(), '📊 Cierre de Mes - Enero', 
'H-72: Preparar planillas de inventario y confirmar acceso a facturas.
H-24: Realizar conteo físico de insumos principales.
Día D: Completar inventario y cerrar compras del mes en el sistema.
Post: Revisar variaciones vs. mes anterior y documentar.', 
'interno', 2, '2025-01-31', '2025-01-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Febrero', 
'H-72: Preparar planillas de inventario.
H-24: Conteo físico.
Día D: Cerrar mes y generar Estado de Resultados.
Post: Analizar CMV y labor cost vs. ventas.', 
'interno', 2, '2025-02-28', '2025-02-28', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Marzo', 
'H-72: Revisar inventario de temporada saliente (verano).
H-24: Conteo físico de insumos.
Día D: Cerrar mes, revisar proveedores y renegociar si aplica.
Post: Comparar Q1 vs. año anterior.', 
'interno', 2, '2025-03-31', '2025-03-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Abril', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar abril.
Post: Revisar estacionalidad otoño y ajustar carta si es necesario.', 
'interno', 2, '2025-04-30', '2025-04-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Mayo', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar mes.
Post: Evaluar rentabilidad de platos de temporada.', 
'interno', 2, '2025-05-31', '2025-05-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Junio', 
'H-72: Cierre semestral - Preparar inventario completo.
H-24: Conteo exhaustivo.
Día D: Cerrar semestre, generar Estado de Resultados acumulado.
Post: Analizar tendencias del primer semestre y planificar segundo.', 
'interno', 3, '2025-06-30', '2025-06-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Julio', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar julio.
Post: Revisar performance invierno.', 
'interno', 2, '2025-07-31', '2025-07-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Agosto', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar agosto.
Post: Preparar presupuesto de temporada alta (primavera).', 
'interno', 2, '2025-08-31', '2025-08-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Septiembre', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar septiembre, revisar Q3.
Post: Planificar fiestas de fin de año y stock de bebidas.', 
'interno', 2, '2025-09-30', '2025-09-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Octubre', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar octubre.
Post: Revisar proveedores para fiestas.', 
'interno', 2, '2025-10-31', '2025-10-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Noviembre', 
'H-72: Preparar inventario.
H-24: Conteo físico.
Día D: Cerrar noviembre, pre-cerrar año.
Post: Stock crítico para diciembre, contratos de extra.', 
'interno', 2, '2025-11-30', '2025-11-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Diciembre', 
'H-72: Cierre anual. Inventario exhaustivo.
H-24: Conteo físico completo de todas las áreas.
Día D: Cerrar año fiscal.
Post: Balance anual, comparativo YoY, objetivos 2026.', 
'interno', 3, '2025-12-31', '2025-12-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- ===========================================
-- 2. MANTENIMIENTO PREVENTIVO
-- ===========================================

-- Equipos de frío - Previa verano (Agosto para estar listos en Sept-Oct)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '❄️ Mantenimiento Preventivo - Equipos de Frío', 
'PREVIO AL VERANO - Revisión obligatoria de equipamiento refrigerado.

Checklist:
• Heladeras: limpiar serpentín, verificar temperatura, revisar burletes
• Freezers: descongelar si hay escarcha, revisar termostatos
• Cámaras: revisar compresor, limpiar filtros, calibrar temperatura
• Aire acondicionado: limpieza de filtros, verificar gas

H-72: Contactar técnico y agendar visita.
H-24: Preparar acceso a equipos y liberar espacio.
Día D: Supervisar mantenimiento y documentar.
Post: Archivar comprobante y programar próximo service.', 
'interno', 3, '2025-08-15', '2025-08-15', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- Equipos de calor - Previa invierno (Marzo-Abril)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '🔥 Mantenimiento Preventivo - Equipos de Calor', 
'PREVIO AL INVIERNO - Revisión de equipos de cocción y calefacción.

Checklist:
• Hornos: calibrar termostatos, limpiar quemadores, revisar juntas
• Anafes/Cocinas: verificar llamas, limpiar inyectores
• Freidoras: cambiar aceite, revisar termostatos, limpiar filtros
• Campanas: limpiar filtros, revisar motor extractor
• Calefacción: revisar estufas, verificar tiraje, stock de gas

H-72: Coordinar con técnico especializado.
H-24: Apagar equipos con tiempo para que enfríen.
Día D: Service completo.
Post: Documentar y programar siguiente mantenimiento.', 
'interno', 3, '2025-03-25', '2025-03-25', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '🔥 Mantenimiento Preventivo - Equipos de Calor (Recordatorio)', 
'Segundo aviso para quienes no hicieron el mantenimiento en marzo.
Última oportunidad antes del frío fuerte.', 
'interno', 2, '2025-04-10', '2025-04-10', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);


-- ===========================================
-- 3. PRODUCTOS DE TEMPORADA (4 al año)
-- ===========================================

-- VERANO (Diciembre)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '☀️ Carta de Verano - Planificación y Compras', 
'CAMBIO DE TEMPORADA - Actualizar carta para verano.

Tips de gestión:
• CMV: frutas de estación (sandía, melón, durazno) tienen mejor precio y rotación
• Carta: priorizar platos frescos, ensaladas, pescados, tragos con hielo
• Stock: aumentar hielo, bebidas frías, frutas. Reducir sopas y guisos.
• Personal: revisar turnos para horarios extendidos nocturnos

Compras recomendadas:
• Cítricos para tragos
• Verduras de hoja verde
• Pescados y mariscos frescos
• Helados y postres fríos

H-72: Definir carta de verano y costos.
H-24: Confirmar proveedores y precios.
Día D: Lanzar nueva carta.
Post: Medir ventas primer semana.', 
'interno', 2, '2025-12-15', '2025-12-15', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- OTOÑO (Marzo)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '🍂 Carta de Otoño - Planificación y Compras', 
'CAMBIO DE TEMPORADA - Actualizar carta para otoño.

Tips de gestión:
• CMV: calabaza, batata, hongos entran en temporada
• Carta: introducir platos tibios, sopas livianas, coctelería con especias
• Stock: empezar a reducir bebidas heladas, aumentar cafés y tés
• Personal: ajustar turnos previo a menor demanda nocturna

Compras recomendadas:
• Zapallo, batata, choclo
• Hongos de estación
• Manzanas para postres
• Especias (canela, jengibre)

H-72: Diseñar carta otoño.
H-24: Negociar precios de temporada.
Día D: Implementar cambios.
Post: Revisar aceptación de nuevos platos.', 
'interno', 2, '2025-03-20', '2025-03-20', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- INVIERNO (Junio)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '❄️ Carta de Invierno - Planificación y Compras', 
'CAMBIO DE TEMPORADA - Actualizar carta para invierno.

Tips de gestión:
• CMV: guisos y estofados permiten aprovechar cortes económicos
• Carta: sopas, cazuelas, fondues, tragos calientes
• Stock: vinos tintos, destilados, chocolates
• Personal: posible reducción de horarios si baja demanda

Compras recomendadas:
• Cortes para estofado (paleta, osobuco)
• Legumbres secas
• Cacao y chocolate
• Vinos tintos de reserva

H-72: Finalizar carta invernal.
H-24: Stockearse de insumos calóricos.
Día D: Lanzar carta invierno.
Post: Analizar ticket promedio vs. verano.', 
'interno', 2, '2025-06-15', '2025-06-15', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- PRIMAVERA (Septiembre)
INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '🌸 Carta de Primavera - Planificación y Compras', 
'CAMBIO DE TEMPORADA - Actualizar carta para primavera.

Tips de gestión:
• CMV: frutillas, espárragos, arvejas frescas en temporada
• Carta: platos más livianos, tragos refrescantes, terrazas
• Stock: comenzar a stockear para temporada alta de fiestas
• Personal: preparar contrataciones para Día de la Madre

Compras recomendadas:
• Frutillas y berries
• Espárragos verdes
• Arvejas y habas
• Hierbas frescas

H-72: Diseñar carta primavera.
H-24: Confirmar disponibilidad de productos frescos.
Día D: Lanzar nueva carta.
Post: Preparar para eventos de octubre-noviembre.', 
'interno', 2, '2025-09-20', '2025-09-20', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);


-- ===========================================
-- 2026 - CIERRES DE MES (primeros 6 meses)
-- ===========================================

INSERT INTO eventos_calendario (id, titulo, mensaje, tipo, prioridad, fecha_inicio, fecha_fin, business_types) VALUES
(gen_random_uuid(), '📊 Cierre de Mes - Enero 2026', 
'Primer cierre del año. Revisar presupuesto anual y objetivos.', 
'interno', 2, '2026-01-31', '2026-01-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Febrero 2026', 
'Cierre febrero. Revisar carnaval y verano.', 
'interno', 2, '2026-02-28', '2026-02-28', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Marzo 2026', 
'Cierre Q1. Balance trimestral.', 
'interno', 2, '2026-03-31', '2026-03-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Abril 2026', 
'Cierre abril.', 
'interno', 2, '2026-04-30', '2026-04-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Mayo 2026', 
'Cierre mayo.', 
'interno', 2, '2026-05-31', '2026-05-31', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']),

(gen_random_uuid(), '📊 Cierre de Mes - Junio 2026', 
'Cierre semestral. Balance H1 2026.', 
'interno', 3, '2026-06-30', '2026-06-30', ARRAY['RESTAURANTE', 'BAR', 'CAFE', 'PANADERIA', 'DARK_KITCHEN', 'HOTEL', 'OTRO']);

-- FIN DEL SCRIPT
-- Total: ~24 eventos de gestión
