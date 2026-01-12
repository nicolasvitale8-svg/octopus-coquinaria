-- Enable RLS on usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 1. DROP existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.usuarios;

-- 2. Policy: ADMINS and CONSULTANTS can view ALL profiles
CREATE POLICY "Admins/Consultants view all"
ON public.usuarios
FOR SELECT
USING (
  exists (
    select 1 from public.usuarios
    where id = auth.uid() and (role = 'admin' OR role = 'consultant')
  )
);

-- 3. Policy: EVERYONE can view THEIR OWN profile
CREATE POLICY "Users view own profile"
ON public.usuarios
FOR SELECT
USING ( auth.uid() = id );

-- 4. Policy: OPTIONAL - If we need clients to view consultant profiles?
-- For now, keep it strict. 

-- 5. Fix Manager Role (AccessGuard check)
-- Ensure 'manager' is recognized if previously blocked
