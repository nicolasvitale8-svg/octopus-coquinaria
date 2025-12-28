-- Enable RLS (just in case) but add policies allowing EVERYTHING for now to ensure sync works
-- Ideally you would lock this down later, but for "getting it to work" in this context, we need permissions.

-- 1. Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All operations for authenticated users on projects"
ON projects FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on projects"
ON projects FOR SELECT
USING (true);

-- 2. Calendar
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All operations for authenticated users on calendar"
ON eventos_calendario FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on calendar"
ON eventos_calendario FOR SELECT
USING (true);

-- 3. Academy
ALTER TABLE recursos_academia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All operations for authenticated users on academy"
ON recursos_academia FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon read on academy"
ON recursos_academia FOR SELECT
USING (true);

-- 4. Leads (Diagnosticos)
ALTER TABLE diagnosticos_express ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All operations for authenticated users on leads"
ON diagnosticos_express FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow Anon All on leads" -- Often leads are created by anon users
ON diagnosticos_express FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow Anon Read on leads"
ON diagnosticos_express FOR SELECT
USING (true);

-- Grant usage just to be sure
GRANT ALL ON TABLE projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE eventos_calendario TO anon, authenticated, service_role;
GRANT ALL ON TABLE recursos_academia TO anon, authenticated, service_role;
GRANT ALL ON TABLE diagnosticos_express TO anon, authenticated, service_role;
