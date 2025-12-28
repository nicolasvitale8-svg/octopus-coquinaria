-- FORCE ADMIN ROLE FOR NICOLAS
-- This ensures RLS sees you as admin, matching the React App hardcoding.

UPDATE public.usuarios
SET role = 'admin'
WHERE email = 'nicolasvitale8@gmail.com';

-- Verify the change
SELECT * FROM public.usuarios WHERE email = 'nicolasvitale8@gmail.com';
