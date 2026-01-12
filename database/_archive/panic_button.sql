-- PLAN Z: BOTÓN DE PÁNICO (Para romper el bucle infinito)
-- Ejecuta esto en el SQL Editor de Supabase.

-- 1. DESACTIVAR LA SEGURIDAD (Permitir todo a todos temporalmente)
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships DISABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR TRIGGERS MANUALMENTE (Por si el script automático falló)
-- Intenta borrar cualquier trigger conocido que pueda causar problemas.
DROP TRIGGER IF EXISTS on_auth_user_created ON public.usuarios;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON public.usuarios;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;

-- 3. ELIMINAR BUCLE DE AUTOMATIZACIÓN (DO block que borra TODO trigger en usuarios)
DO $$ 
DECLARE 
    trg text;
BEGIN 
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'usuarios' 
    LOOP 
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.usuarios CASCADE;', trg); 
    END LOOP; 
END $$;

-- 4. VERIFICACIÓN (CRUCIAL):
-- Si ves un número en "Resultados" (ej. 1, 5, 10), ENTONCES FUNCIONÓ.
SELECT count(*) as total_usuarios FROM public.usuarios;
