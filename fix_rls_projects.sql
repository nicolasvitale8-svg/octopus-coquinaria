-- Enable RLS on projects if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 1. DROP existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
DROP POLICY IF EXISTS "Admins can do everything" ON public.projects;
DROP POLICY IF EXISTS "Consultants can view all" ON public.projects;
DROP POLICY IF EXISTS "Clients can view own project" ON public.projects;

-- 2. Policy for ADMINS (Full Access)
-- We check against the public.usuarios table for the role.
CREATE POLICY "Admins full access"
ON public.projects
FOR ALL
USING (
  exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'admin'
  )
);

-- 3. Policy for CONSULTANTS (View All, maybe Edit?)
-- Assuming consultants can view all projects.
CREATE POLICY "Consultants view all"
ON public.projects
FOR SELECT
USING (
  exists (
    select 1 from public.usuarios
    where id = auth.uid() and role = 'consultant'
  )
);

-- 4. Policy for CLIENTS (View OWN project only)
-- Matches email in team->client_email OR inside team->client_contacts
CREATE POLICY "Clients view own project"
ON public.projects
FOR SELECT
USING (
    -- Direct match on client_email
    (team->>'client_email' = auth.jwt()->>'email')
    OR
    -- Match within client_contacts array
    (
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(team->'client_contacts') as contact
        WHERE contact->>'email' = auth.jwt()->>'email'
      )
    )
);

-- 5. Fix Nicolas to be Admin (Safety Net)
UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

-- 6. Also ensure Supabase Service Role has bypass (default, but good to know)
-- (No action needed, service role bypasses RLS)

-- Verify permissions for 'user' role on the table (sometimes needed for RLS to even trigger)
GRANT SELECT ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated; -- RLS will restrict this
