-- FIX INFINITE RECURSION IN RLS
-- The previous policy caused a loop because checking if you are admin required reading the table, which checked if you were admin...

-- 1. Create a secure function to read roles bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- IMPORTANT: This runs with system privileges, bypassing RLS
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.usuarios WHERE id = auth.uid();
$$;

-- 2. Drop the buggy policy
DROP POLICY IF EXISTS "Admins and Consultants can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;

-- 3. Re-create policies using the secure function
-- Policy for Admins/Consultants (View ALL)
CREATE POLICY "Admins and Consultants can view all"
ON public.usuarios
FOR SELECT
USING (
  public.get_my_role() IN ('admin', 'consultant')
);

-- Policy for Regular Users (View OWN)
CREATE POLICY "Users can view own profile"
ON public.usuarios
FOR SELECT
USING (
  auth.uid() = id
);
