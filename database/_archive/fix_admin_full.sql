-- FINAL RECOVERY SCRIPT
-- This script looks up your UUID from the authentication system and ensures you exist in the public table with ADMIN status.

DO $$
DECLARE
  target_email TEXT := 'nicolasvitale8@gmail.com';
  user_id UUID;
BEGIN
  -- 1. Get the ID from auth.users (Supabase internal table)
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found in auth.users. Have you signed up?', target_email;
  END IF;

  -- 2. Insert or Update public.usuarios
  INSERT INTO public.usuarios (id, email, full_name, role)
  VALUES (
    user_id, 
    target_email, 
    'Nicolas Vitale', -- Hardcoded name for recovery
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'admin',
    email = EXCLUDED.email; -- Refresh email just in case

  RAISE NOTICE 'SUCCESS: User % is now ADMIN.', target_email;
END $$;
