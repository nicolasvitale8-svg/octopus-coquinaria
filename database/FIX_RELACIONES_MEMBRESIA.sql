-- 🔥 FIX_MEMBERSHIP_RELATION.sql 🔥
-- Resuelve el error: "Could not find a relationship between 'business_memberships' and 'projects'"

-- 1. Asegurar que existe la clave foránea entre business_memberships y proyectos
-- Primero intentamos borrar por si tiene un nombre distinto
ALTER TABLE IF EXISTS public.business_memberships 
DROP CONSTRAINT IF EXISTS business_memberships_business_id_fkey;

-- Agregamos la relación formal
ALTER TABLE public.business_memberships
ADD CONSTRAINT business_memberships_business_id_fkey 
FOREIGN KEY (business_id) 
REFERENCES public.projects(id) 
ON DELETE CASCADE;

-- 2. Asegurar también la relación con usuarios por si acaso
ALTER TABLE IF EXISTS public.business_memberships 
DROP CONSTRAINT IF EXISTS business_memberships_user_id_fkey;

ALTER TABLE public.business_memberships
ADD CONSTRAINT business_memberships_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.usuarios(id) 
ON DELETE CASCADE;

-- 3. Refrescar el cache de PostgREST (esto se hace automático al cambiar el esquema, 
-- pero a veces ayuda tocar un comentario para forzarlo en versiones viejas)
COMMENT ON TABLE public.business_memberships IS 'Mapeo de usuarios a proyectos Octopus';

SELECT '✅ Relaciones reparadas. Por favor, refresca la aplicación en el navegador.' as result;
