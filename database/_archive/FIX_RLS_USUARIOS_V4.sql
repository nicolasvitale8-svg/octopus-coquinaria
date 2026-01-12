-- ==============================================================================
-- 🐙 FIX: RLS USUARIOS - PERMISOS DE EDICIÓN
-- Resolves "new row violates row-level security policy for table usuarios"
-- ==============================================================================

-- 1. Asegurar que la función de Admin es robusta y no recursiva
CREATE OR REPLACE FUNCTION public.is_admin_v4()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    user_email text;
BEGIN
    -- Fallback de seguridad por email (Nicolas)
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    IF user_email = 'nicolasvitale8@gmail.com' THEN RETURN TRUE; END IF;

    -- Intento por tabla usuarios (Security Definer ignora RLS en la tabla usuarios)
    SELECT role INTO user_role FROM public.usuarios WHERE id = auth.uid();
    RETURN (user_role = 'admin');
END;
$$;

-- 2. Limpiar políticas antiguas (nombres conocidos de ejecuciones previas)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'usuarios' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.usuarios', pol.policyname);
    END LOOP;
END $$;

-- 3. Crear políticas limpias y definitivas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Lectura: Todos los autenticados pueden ver perfiles básicos
CREATE POLICY "v4_usuarios_select" ON public.usuarios FOR SELECT
USING (true);

-- Inserción: Registro propio o Admin
CREATE POLICY "v4_usuarios_insert" ON public.usuarios FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_admin_v4());

-- Actualización: Solo Admin o el propio usuario
CREATE POLICY "v4_usuarios_update" ON public.usuarios FOR UPDATE
USING (auth.uid() = id OR public.is_admin_v4())
WITH CHECK (auth.uid() = id OR public.is_admin_v4());

-- Eliminación: Solo Admin
CREATE POLICY "v4_usuarios_delete" ON public.usuarios FOR DELETE
USING (public.is_admin_v4());

SELECT '✅ RLS USUARIOS CORREGIDO. Prueba editar la ficha ahora.' as status;
