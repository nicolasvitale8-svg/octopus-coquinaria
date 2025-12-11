-- Enable RLS (Should already be enabled, but good practice)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 1. Policy for INSERT (Creation)
-- Allow anyone (anon or authenticated) to insert projects
DROP POLICY IF EXISTS "Enable insert for everyone" ON projects;
CREATE POLICY "Enable insert for everyone" 
ON projects FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Policy for SELECT (Read)
-- Allow anyone to read projects
DROP POLICY IF EXISTS "Enable select for everyone" ON projects;
CREATE POLICY "Enable select for everyone" 
ON projects FOR SELECT 
TO public 
USING (true);

-- 3. Policy for UPDATE
-- Allow anyone to update projects
DROP POLICY IF EXISTS "Enable update for everyone" ON projects;
CREATE POLICY "Enable update for everyone" 
ON projects FOR UPDATE 
TO public 
USING (true)
WITH CHECK (true);

-- 4. Policy for DELETE
-- Allow anyone to delete projects
DROP POLICY IF EXISTS "Enable delete for everyone" ON projects;
CREATE POLICY "Enable delete for everyone" 
ON projects FOR DELETE 
TO public 
USING (true);

-- Fix for syncing issues: Ensure published/status columns are writable
GRANT ALL ON TABLE projects TO anon;
GRANT ALL ON TABLE projects TO authenticated;
GRANT ALL ON TABLE projects TO service_role;
