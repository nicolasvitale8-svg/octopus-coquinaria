-- 🚨 NUCLEAR_FIX_PIZARRA_V4 (DESACOPLADO) 🚨
-- Objetivo: Que la Pizarra sea visible PARA TODO EL MUNDO sin depender de funciones que den 401.

-- 1. Permisos de Esquema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Limpiar políticas de la Pizarra
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_pizarra" ON public.public_board_items;
DROP POLICY IF EXISTS "admin_manage_pizarra" ON public.public_board_items;
DROP POLICY IF EXISTS "board_select_public" ON public.public_board_items;
DROP POLICY IF EXISTS "board_all_admin" ON public.public_board_items;

-- 3. POLÍTICAS DESACOPLADAS (ESTO ES LA CLAVE)
-- Para ANON (invitados): Solo ven lo visible, sin llamar a ninguna función.
CREATE POLICY "pizarra_anon_read" 
ON public.public_board_items
FOR SELECT 
TO anon 
USING (is_visible = true);

-- Para AUTHENTICATED: Ven lo visible O si son admins llamando a la función.
CREATE POLICY "pizarra_auth_read" 
ON public.public_board_items
FOR SELECT 
TO authenticated 
USING (is_visible = true OR public.is_admin_or_consultant());

-- Para GESTIÓN: Solo admins.
CREATE POLICY "pizarra_admin_manage" 
ON public.public_board_items
FOR ALL 
TO authenticated 
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- 4. Permisos de ejecución de respaldo (Solo por si acaso)
GRANT EXECUTE ON FUNCTION public.is_admin_or_consultant() TO authenticated;
GRANT SELECT ON public.public_board_items TO anon, authenticated;

SELECT '✅ POLÍTICAS DESACOPLADAS APLICADAS. La Pizarra ahora es 100% visible para invitados.' as status;
