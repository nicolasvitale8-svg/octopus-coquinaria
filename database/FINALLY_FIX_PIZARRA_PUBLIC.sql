-- 🚨 REGLAS DE ORO PARA LA PIZARRA PÚBLICA 🚨
-- Ejecutar este script en el SQL Editor de Supabase para habilitar la visibilidad total.

-- 1. Habilitar RLS (Seguridad de Fila)
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas anteriores para evitar conflictos
DROP POLICY IF EXISTS "public_read_board" ON public.public_board_items;
DROP POLICY IF EXISTS "admin_all_board" ON public.public_board_items;
DROP POLICY IF EXISTS "Allow public read" ON public.public_board_items;

-- 3. Crear política de LECTURA UNIVERSAL (para todos, logueados o no)
CREATE POLICY "public_read_board" 
ON public.public_board_items
FOR SELECT 
TO public 
USING (is_visible = true);

-- 4. Crear política de GESTIÓN PARA ADMINS
CREATE POLICY "admin_all_board" 
ON public.public_board_items
FOR ALL 
TO authenticated 
USING (true); -- El filtro de rol se puede manejar en la app o con una función más compleja

-- 5. ASIGNAR PERMISOS DE API (CRUCIAL PARA ERROR 401)
-- Esto le dice a Supabase que el rol 'anon' (invitados) tiene permiso para ver esta tabla.
GRANT SELECT ON public.public_board_items TO anon;
GRANT SELECT ON public.public_board_items TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Verificación de estado
SELECT '✅ PIZARRA LIBERADA. Si el Home no tiene items, verificá que los registros en la tabla tengan is_visible = true' as mensaje;
