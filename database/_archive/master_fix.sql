-- MASTER FIX SCRIPT (The "One Ring" to fix them all)
-- Runs all necessary repairs in order.

-- 1. FIX INFINITE RECURSION HELPER
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 2. FORCE ADMIN USER (Nicolas)
-- Ensures the user exists and is Admin
DO $$
DECLARE
  v_email TEXT := 'nicolasvitale8@gmail.com';
  v_uid UUID;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.usuarios (id, email, full_name, role)
    VALUES (v_uid, v_email, 'Nicolas Vitale', 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin', email = v_email;
  END IF;
END $$;

-- 3. FIX PROJECTS RLS (Admin View All, Client View Own)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access" ON public.projects;
DROP POLICY IF EXISTS "Clients view own project" ON public.projects;
DROP POLICY IF EXISTS "Consultants view all" ON public.projects;

CREATE POLICY "Admins full access" ON public.projects
FOR ALL USING (public.get_my_role() IN ('admin', 'consultant'));

CREATE POLICY "Clients view own project" ON public.projects
FOR SELECT USING (
    (team->>'client_email' = auth.jwt()->>'email') OR
    (EXISTS (SELECT 1 FROM jsonb_array_elements(team->'client_contacts') as c WHERE c->>'email' = auth.jwt()->>'email'))
);

CREATE POLICY "Authenticated can create projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (true);

-- 4. FIX PUBLIC ACCESS (Leads & New Users) -- FIXES 500 ERROR
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert leads" ON public.diagnosticos_express;
DROP POLICY IF EXISTS "Admins view all leads" ON public.diagnosticos_express;

CREATE POLICY "Public can insert leads" ON public.diagnosticos_express
FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins view all leads" ON public.diagnosticos_express
FOR ALL USING (public.get_my_role() IN ('admin', 'consultant'));

-- 5. FIX USERS TABLE (Self Update)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;

CREATE POLICY "Users can update own profile" ON public.usuarios
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.usuarios
FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. GRANT BASIC PERMISSIONS
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.diagnosticos_express TO authenticated, anon;
GRANT ALL ON public.usuarios TO authenticated, anon;

