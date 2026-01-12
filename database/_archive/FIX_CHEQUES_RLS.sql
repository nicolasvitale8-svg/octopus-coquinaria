-- RLS SECURITY FIX FOR FINANCE CHEQUES

-- 1. Drop the permissive policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.finance_cheques;

-- 2. Create strict policy based on project membership
CREATE POLICY "Enable access for project members" ON public.finance_cheques
    FOR ALL
    TO authenticated
    USING (
        project_id IN (
            SELECT project_id 
            FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT project_id 
            FROM public.project_members 
            WHERE user_id = auth.uid()
        )
    );

-- 3. Verify indexes exist for performance (from previous CREATE script check, they seemed to exist but good to be sure)
CREATE INDEX IF NOT EXISTS idx_finance_cheques_project_id ON public.finance_cheques(project_id);
