-- 🔥 EMERGENCY_FIX_PERMISSIONS_V2.sql 🔥
-- Objetivo: Liberar TODO el acceso de lectura para la Pizarra, Academia y Calendario.

-- 1. Asegurar acceso al esquema public para el rol anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Permisos explícitos de lectura a las tablas
GRANT SELECT ON public.public_board_items TO anon, authenticated;
GRANT SELECT ON public.recursos_academia TO anon, authenticated;
GRANT SELECT ON public.eventos_calendario TO anon, authenticated;

-- 3. Resetear y aplicar políticas RLS (Pizarra)
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_board" ON public.public_board_items;
CREATE POLICY "public_read_board" ON public.public_board_items
FOR SELECT TO public
USING (is_visible = true);

-- 4. Resetear y aplicar políticas RLS (Academia)
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_academy" ON public.recursos_academia;
CREATE POLICY "public_read_academy" ON public.recursos_academia
FOR SELECT TO public
USING (true);

-- 5. Resetear y aplicar políticas RLS (Calendario)
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_calendar" ON public.eventos_calendario;
CREATE POLICY "public_read_calendar" ON public.eventos_calendario
FOR SELECT TO public
USING (true);

-- Verificación final
SELECT '✅ Permisos y RLS aplicados. La Pizarra y Academia deben ser visibles para todos.' as result;
