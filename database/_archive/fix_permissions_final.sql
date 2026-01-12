-- Desbloqueo GENERAL de Tablas
-- Ejecuta esto para asegurar que Leads, Proyectos y Calendario funcionen.

-- 1. PROYECTOS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Projects Public Access" ON projects;
CREATE POLICY "Projects Public Access" ON projects FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. LEADS (Diagnosticos)
ALTER TABLE diagnosticos_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leads Public Access" ON diagnosticos_express;
CREATE POLICY "Leads Public Access" ON diagnosticos_express FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. CALENDARIO
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Calendar Public Access" ON eventos_calendario;
CREATE POLICY "Calendar Public Access" ON eventos_calendario FOR ALL TO public USING (true) WITH CHECK (true);

-- Permisos Generales
GRANT ALL ON TABLE projects TO anon;
GRANT ALL ON TABLE projects TO authenticated;
GRANT ALL ON TABLE projects TO service_role;

GRANT ALL ON TABLE diagnosticos_express TO anon;
GRANT ALL ON TABLE diagnosticos_express TO authenticated;
GRANT ALL ON TABLE diagnosticos_express TO service_role;

GRANT ALL ON TABLE eventos_calendario TO anon;
GRANT ALL ON TABLE eventos_calendario TO authenticated;
GRANT ALL ON TABLE eventos_calendario TO service_role;
