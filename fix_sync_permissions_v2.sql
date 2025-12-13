-- SCRIPT ROBUSTO DE PERMISOS (V2)
-- Este script BORRA las políticas anteriores si existen y las vuelve a crear.
-- Esto evita el error "policy already exists".

-- 1. PROYECTOS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on projects" ON projects;
DROP POLICY IF EXISTS "Allow Anon read on projects" ON projects;

CREATE POLICY "Allow All operations for authenticated users on projects"
ON projects FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on projects"
ON projects FOR SELECT
USING (true);

-- 2. CALENDARIO
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on calendar" ON eventos_calendario;
DROP POLICY IF EXISTS "Allow Anon read on calendar" ON eventos_calendario;

CREATE POLICY "Allow All operations for authenticated users on calendar"
ON eventos_calendario FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on calendar"
ON eventos_calendario FOR SELECT
USING (true);

-- 3. ACADEMIA
ALTER TABLE recursos_academia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on academy" ON recursos_academia;
DROP POLICY IF EXISTS "Allow Anon read on academy" ON recursos_academia;

CREATE POLICY "Allow All operations for authenticated users on academy"
ON recursos_academia FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on academy"
ON recursos_academia FOR SELECT
USING (true);

-- 4. LEADS (Diagnosticos)
ALTER TABLE diagnosticos_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on leads" ON diagnosticos_express;
DROP POLICY IF EXISTS "Allow Anon All on leads" ON diagnosticos_express;
DROP POLICY IF EXISTS "Allow Anon Read on leads" ON diagnosticos_express;

CREATE POLICY "Allow All operations for authenticated users on leads"
ON diagnosticos_express FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon All on leads"
ON diagnosticos_express FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow Anon Read on leads"
ON diagnosticos_express FOR SELECT
USING (true);

-- 5. USUARIOS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All operations for authenticated users on usuarios" ON usuarios;
DROP POLICY IF EXISTS "Allow Anon read on usuarios" ON usuarios;

CREATE POLICY "Allow All operations for authenticated users on usuarios"
ON usuarios FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Grant usage final
GRANT ALL ON TABLE projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE eventos_calendario TO anon, authenticated, service_role;
GRANT ALL ON TABLE recursos_academia TO anon, authenticated, service_role;
GRANT ALL ON TABLE diagnosticos_express TO anon, authenticated, service_role;
GRANT ALL ON TABLE usuarios TO anon, authenticated, service_role;
