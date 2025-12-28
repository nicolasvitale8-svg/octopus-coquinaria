-- FIX PUBLIC ACCESS (Allow Inserts)
-- My previous script locked the doors so tight that new users couldn't enter.
-- This script re-opens the "Entry Doors" (INSERT permissions).

-- 1. ALLOW PUBLIC TO CREATE LEADS (Diagnosticos)
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert leads" 
ON public.diagnosticos_express 
FOR INSERT 
TO public -- 'public' includes anon and authenticated
WITH CHECK (true);

-- 2. ALLOW USERS TO MANAGE THEIR OWN PROFILE
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own row (e.g. login updates)
CREATE POLICY "Users can update own profile" 
ON public.usuarios 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow inserting own profile (if client-side creation is used)
CREATE POLICY "Users can insert own profile" 
ON public.usuarios 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. ENSURE PROJECTS ARE CREATABLE BY LOGGED IN USERS
CREATE POLICY "Authenticated can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);
