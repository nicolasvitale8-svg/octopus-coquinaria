-- 🔥 EMERGENCY_FIX_PERMISSIONS.sql 🔥
-- Objetivo: Forzar permisos de lectura pública para las tablas críticas que fallaron (RLS 42501).

-- 🟢 1. PERMISOS DE TABLA (GRANT)
-- Estos son necesarios además de la RLS para asegurar que el rol 'anon' pueda siquiera preguntar.
GRANT SELECT ON public.recursos_academia TO anon, authenticated;
GRANT SELECT ON public.public_board_items TO anon, authenticated;
GRANT SELECT ON public.eventos_calendario TO anon, authenticated;

-- 🟢 2. POLÍTICAS RLS (ACADEMIA)
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_resources_v2" ON public.recursos_academia;
CREATE POLICY "public_select_resources_v2" ON public.recursos_academia
FOR SELECT TO public
USING (true);

-- 🟢 3. POLÍTICAS RLS (PIZARRA)
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_board_v2" ON public.public_board_items;
CREATE POLICY "public_select_board_v2" ON public.public_board_items
FOR SELECT TO public
USING (is_visible = true);

-- 🟢 4. POLÍTICAS RLS (TICKER)
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_events_v2" ON public.eventos_calendario;
CREATE POLICY "public_select_events_v2" ON public.eventos_calendario
FOR SELECT TO public
USING (true);

-- MENSAJE DE ÉXITO
SELECT '🚀 Permisos restaurados. La Academia y Pizarra ahora deberían ser visibles en producción.' as status;
