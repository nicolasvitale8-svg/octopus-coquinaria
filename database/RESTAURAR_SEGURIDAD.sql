
-- ==============================================================================
-- 🐙 RESTAURAR SEGURIDAD (RLS) - Versión Final
-- Cierra el acceso público y vuelve a proteger los datos.
-- Ejecuta esto ahora que ya puedes entrar con tu email.
-- ==============================================================================

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- 1. Re-activar RLS en ABSOLUTAMENTE TODAS las tablas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Revocar permisos al rol anónimo (anon) para máxima seguridad
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 3. Asegurar que los usuarios logueados (authenticated) tengan sus permisos normales
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- NOTA: Las políticas de acceso internas (RLS) volverán a regir,
-- por lo que cada usuario solo verá lo que le pertenece.
SELECT '✅ SEGURIDAD RESTAURADA CORRECTAMENTE' as status;