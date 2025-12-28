-- SCRIPT V3.4: FIX PERFIL FANTASMA Y TRIGGERS
-- Diagnóstico: El usuario existe en Auth pero no en Public, por lo que las funciones de rol fallan.

-- 1. INSERTAR EL PERFIL FALTANTE MANUALMENTE
-- Insertamos en public.usuarios copiando datos de auth.users si no existen.
INSERT INTO public.usuarios (id, email, full_name, role, created_at, permissions)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin Nicolas'), 
    'admin', 
    created_at,
    '["super_admin"]'::jsonb
FROM auth.users
WHERE email = 'nicolasvitale8@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    permissions = '["super_admin"]'::jsonb; -- Si ya existe, forzamos admin.


-- 2. ASEGURAR QUE LOS NUEVOS USUARIOS SE CREEN AUTOMÁTICAMENTE (TRIGGER)
-- Esta función se ejecuta cada vez que alguien se registra confirmado.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, full_name, role, permissions)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'client', -- Rol por defecto
    '[]'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Vincular trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. PERMITIR INSERT MANUAL (Por si el trigger falla o el front intenta auto-crear)
DROP POLICY IF EXISTS "v3_users_insert_own" ON public.usuarios;
CREATE POLICY "v3_users_insert_own" ON public.usuarios FOR INSERT
WITH CHECK ( auth.uid() = id );


SELECT 'FIX V3.4 APLICADO: PERFIL CREADO Y TRIGGER RESTAURADO. RECARGA LA APP.' as status;
