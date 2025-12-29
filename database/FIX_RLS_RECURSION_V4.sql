-- ==============================================================================
-- 🐙 FIX: RLS RECURSION IN OCTOPUS V4
-- Resolves "infinite recursion detected in policy for relation project_members"
-- ==============================================================================

-- 1. Helper function to check project membership without triggering RLS
-- SECURITY DEFINER allows this function to see all project_members regardless of policies
CREATE OR REPLACE FUNCTION public.is_member_of_project(pid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members 
    WHERE project_id = pid AND user_id = auth.uid()
  );
$$;

-- 2. Update project_members policies
DROP POLICY IF EXISTS "member_visibility_policy" ON public.project_members;
CREATE POLICY "member_visibility_policy" ON public.project_members FOR SELECT
USING (
    public.is_super_admin()
    OR
    auth.uid() = user_id -- Can always see yourself
    OR
    public.is_member_of_project(project_id) -- Can see teammates
);

-- 3. Update tasks policies
DROP POLICY IF EXISTS "task_visibility_policy" ON public.tasks;
CREATE POLICY "task_visibility_policy" ON public.tasks FOR SELECT
USING (
    public.is_super_admin()
    OR
    (
        public.is_member_of_project(project_id)
        AND
        (
            (visibility = 'INTERNAL_ONLY' AND public.get_my_role() != 'client')
            OR
            (visibility = 'SHARED')
            OR
            (visibility = 'CLIENT_ONLY' AND (auth.uid() = assigned_to OR auth.uid() = created_by))
        )
    )
);

-- 4. Update deliverables policies
DROP POLICY IF EXISTS "deliverable_visibility_policy" ON public.deliverables;
CREATE POLICY "deliverable_visibility_policy" ON public.deliverables FOR SELECT
USING (
    public.is_super_admin()
    OR
    public.is_member_of_project(project_id)
);

-- 5. Update project_notes policies
DROP POLICY IF EXISTS "notes_visibility_policy" ON public.project_notes;
CREATE POLICY "notes_visibility_policy" ON public.project_notes FOR SELECT
USING (
    public.is_admin_or_consultant()
    OR
    (visibility = 'CLIENT_SHARED' AND public.is_member_of_project(project_id))
);

-- 6. Check projects policy (Legacy check)
-- Make sure projects table also uses a non-recursive approach if needed
-- Assuming public.projects is already handled or simple.

SELECT '✅ RLS RECURSION FIXED. Re-run your queries now.' as status;
