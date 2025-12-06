-- Script para poblar la tabla recursos_academia con los datos iniciales de demo
-- Incluye el video de YouTube actualizado para "Costo de Mercadería"

INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium, created_at)
SELECT 'Cómo calcular tu Costo de Mercadería (CMV) Real', 'video', 'https://youtu.be/7k1iPypNCBw', 'Dejá de adivinar. Aprendé la fórmula exacta para saber cuánto te cuesta cada plato. La mayoría de los gastronómicos confunde compras con costo. En este video explicamos la diferencia vital entre lo que pagás y lo que realmente consumís.', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Costo de Mercader%');

INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium, created_at)
SELECT 'Checklist de Apertura y Cierre: Tu salvavidas', 'plantilla', 'https://docs.google.com/spreadsheets/d/1ExampleSheet/edit', 'Plantilla lista para imprimir que asegura que tu local abra y cierre perfecto siempre. Estandarizá el inicio y fin del día.', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Checklist%');

INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium, created_at)
SELECT 'Finanzas para no Financieros', 'video', 'https://youtu.be/example1', 'Ordená los números de tu restaurante en 3 pasos simples. Entendé tu estado de resultados sin ser contador.', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Finanzas%');

INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium, created_at)
SELECT 'Operación Blindada', 'video', 'https://youtu.be/example2', 'Sistemas para que el negocio funcione sin que estés encima. Delegá con confianza.', false, NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Operación Blindada%');
