-- INVESTIGAR RELACIONES USUARIO-PROYECTO
-- 1. Ver estructura de business_memberships
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'business_memberships';

-- 2. Ver registros de ejemplo
SELECT * FROM public.business_memberships LIMIT 5;
