-- ===============================================================
-- SOLUCIÓN DEFINITIVA V2 (ESTRATEGIA JWT - SIN RECURSIÓN)
-- ===============================================================

-- 1. Asignar rol de Admin en los METADATOS de Supabase (auth.users)
-- Esto permite chequear si es admin sin leer ninguna tabla, evitando bloqueos 100%.
UPDATE auth.users
SET email_confirmed_at = now(),
    raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      '{"provider": "email", "role": "admin"}'::jsonb
WHERE email = 'admin@octopus.com';


-- 2. Redefinir la función is_admin para leer SOLO los metadatos (JWT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  headers text;
  roles text;
BEGIN
  -- Verificar si el rol en los metadatos de la sesión es 'admin'
  -- (Esto no consulta ninguna tabla, es instantáneo y seguro)
  return ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Asegurar tabla de usuarios pública (para la UI)
INSERT INTO public.usuarios (id, email, full_name, role)
SELECT id, email, 'Super Admin', 'admin'
FROM auth.users 
WHERE email = 'admin@octopus.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';


-- 4. Limpieza de Políticas Antiguas (Idempotencia)
DROP POLICY IF EXISTS "Admin Gestionar Usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios Ver Su Perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Admin Total Usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.usuarios;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.usuarios;

DROP POLICY IF EXISTS "Lectura publica de eventos" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Admin gestiona eventos" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Admin Total Calendario" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Usuarios Leer Calendario" ON public.eventos_calendario;

DROP POLICY IF EXISTS "Lectura de recursos" ON public.recursos_academia;
DROP POLICY IF EXISTS "Admin gestiona recursos" ON public.recursos_academia;
DROP POLICY IF EXISTS "Admin Total Academia" ON public.recursos_academia;
DROP POLICY IF EXISTS "Usuarios Leer Academia" ON public.recursos_academia;


-- 5. Reactivar y crear Políticas Nuevas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;

-- Usuarios: Admin hace todo, Usuario se ve a sí mismo
CREATE POLICY "Admin Total Usuarios" ON public.usuarios
FOR ALL TO authenticated
USING ( is_admin() OR auth.uid() = id )
WITH CHECK ( is_admin() OR auth.uid() = id );

-- Calendario: Admin hace todo, Usuario lee
CREATE POLICY "Admin Total Calendario" ON public.eventos_calendario
FOR ALL TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

CREATE POLICY "Usuarios Leer Calendario" ON public.eventos_calendario
FOR SELECT TO authenticated
USING ( true );

-- Academia: Admin hace todo, Usuario lee
CREATE POLICY "Admin Total Academia" ON public.recursos_academia
FOR ALL TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

CREATE POLICY "Usuarios Leer Academia" ON public.recursos_academia
FOR SELECT TO authenticated
USING ( true );


-- 6. Verificación
SELECT id, email, raw_app_meta_data FROM auth.users WHERE email = 'admin@octopus.com';
