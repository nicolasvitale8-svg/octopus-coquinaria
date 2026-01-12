-- DESHABILITAR RLS COMPLETAMENTE (TEMPORAL)
-- Esto confirma si RLS es el problema

ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('project_members', 'eventos_calendario', 'projects');
