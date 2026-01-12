-- EMERGENCY FIX RLS ACCESS (PROJECTS & LEADS)
-- This script resets policies to ensure ADMINS have full visibility.

-- 1. Helper Function (Recursion Breaker)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 2. FIX TABLE: PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access" ON public.projects;
DROP POLICY IF EXISTS "Consultants view all" ON public.projects;
DROP POLICY IF EXISTS "Clients view own project" ON public.projects;

-- Admin Policy (Safe)
CREATE POLICY "Admins full access" ON public.projects
FOR ALL USING (
  public.get_my_role() IN ('admin', 'consultant')
);

-- Client Policy
CREATE POLICY "Clients view own project" ON public.projects
FOR SELECT USING (
    (team->>'client_email' = auth.jwt()->>'email')
    OR
    (EXISTS (
        SELECT 1 FROM jsonb_array_elements(team->'client_contacts') as c
        WHERE c->>'email' = auth.jwt()->>'email'
    ))
);

-- 3. FIX TABLE: DIAGNOSTICOS_EXPRESS (Leads)
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins view all leads" ON public.diagnosticos_express;

-- Admin Policy (Safe)
CREATE POLICY "Admins view all leads" ON public.diagnosticos_express
FOR ALL USING (
  public.get_my_role() IN ('admin', 'consultant')
);

-- 4. GRANT PERMISSIONS (Just in case)
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.diagnosticos_express TO authenticated;

-- 5. VERIFY DATA (Optional Check)
DO $$
BEGIN
  RAISE NOTICE 'Permissions reset. If you are Admin, you should see data now.';
END $$;
