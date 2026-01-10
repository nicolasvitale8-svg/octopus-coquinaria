-- 🚨 NUCLEAR_FIX_PIZARRA_V3.sql 🚨
-- FINAL BOSS: Libera la Pizarra de una vez por todas.

-- 1. Permisos de Esquema (Base)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Asegurar que las funciones de seguridad sean ejecutables por TODOS
-- (Sin esto, el RLS falla antes de empezar)
GRANT EXECUTE ON FUNCTION public.is_admin_or_consultant() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon, authenticated;

-- 3. Limpiar y simplificar la Pizarra (public_board_items)
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_board" ON public.public_board_items;
DROP POLICY IF EXISTS "board_select_public" ON public.public_board_items;
DROP POLICY IF EXISTS "admin_all_board" ON public.public_board_items;
DROP POLICY IF EXISTS "board_all_admin" ON public.public_board_items;

-- Política 1: LECTURA PÚBLICA (Extremadamente simple)
CREATE POLICY "public_read_pizarra" 
ON public.public_board_items
FOR SELECT 
TO public 
USING (is_visible = true);

-- Política 2: GESTIÓN ADMIN (Para vos)
CREATE POLICY "admin_manage_pizarra" 
ON public.public_board_items
FOR ALL 
TO authenticated 
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- 4. Permisos de Tabla explícitos
GRANT SELECT ON public.public_board_items TO anon;
GRANT ALL ON public.public_board_items TO authenticated;

-- 5. Failsafe: Si la función is_admin_or_consultant no maneja NULLs, revienta para anon.
-- Vamos a redefinirla para que sea ultra segura.
CREATE OR REPLACE FUNCTION public.is_admin_or_consultant()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    u_id uuid := auth.uid();
    user_role text;
BEGIN
    -- Si no hay usuario logueado, NO es admin ni consultor
    IF u_id IS NULL THEN RETURN FALSE; END IF;
    
    -- Failsafe Nicolas
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = u_id AND email = 'nicolasvitale8@gmail.com') THEN
        RETURN TRUE;
    END IF;

    SELECT role INTO user_role FROM public.usuarios WHERE id = u_id;
    RETURN (user_role IN ('admin', 'consultant'));
END;
$$;

-- Volver a otorgar permiso tras recrear
GRANT EXECUTE ON FUNCTION public.is_admin_or_consultant() TO anon, authenticated;

SELECT '✅ OPERACIÓN NUCLEAR COMPLETADA. La Pizarra DEBE verse ahora.' as status;
