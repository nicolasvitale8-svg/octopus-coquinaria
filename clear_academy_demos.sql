-- SCRIPT PARA LIMPIAR DATOS DE ACADEMIA (RESET)
-- Ejecuta esto para borrar TODOS los recursos y empezar de cero.

DELETE FROM public.recursos_academia;

-- Opcional: Si solo quieres borrar los demos de ejemplo pero dejar los nuevos que hayas creado:
-- DELETE FROM public.recursos_academia WHERE titulo ILIKE '%Ejemplo%' OR titulo ILIKE '%Demo%';
