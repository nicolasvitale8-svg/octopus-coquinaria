-- 🔥 FIX_PUBLIC_ACCESS_FINAL.sql 🔥
-- Objetivo: Garantizar que CUALQUIER USUARIO (incluso anónimo/nuevo) pueda ver la Pizarra, el Ticker y la Academia.
-- Esto es crítico para la estrategia de "Catching" (atrapar clientes).

-- 🟢 1. PIZARRA DE NOVEDADES (public_board_items)
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_board" ON public.public_board_items;

-- Todo el mundo puede leer items marcados como visibles
CREATE POLICY "public_select_board" ON public.public_board_items
FOR SELECT TO public
USING (is_visible = true);

-- 🟢 2. TICKER GASTRONÓMICO (eventos_calendario)
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_events" ON public.eventos_calendario;

-- Todo el mundo puede leer eventos
CREATE POLICY "public_select_events" ON public.eventos_calendario
FOR SELECT TO public
USING (true);

-- 🟢 3. ACADEMIA OCTOPUS (recursos_academia)
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_select_resources" ON public.recursos_academia;

-- Todo el mundo puede leer recursos (el filtrado de PRO vs FREE se hace en el frontend o con otra logica, pero la tabla debe ser legible)
CREATE POLICY "public_select_resources" ON public.recursos_academia
FOR SELECT TO public
USING (true);

-- 🟢 4. Permisos de escritura (Solo Admin/Consultant)
-- (Mantenemos la seguridad de escritura)

DROP POLICY IF EXISTS "admin_all_board" ON public.public_board_items;
CREATE POLICY "admin_all_board" ON public.public_board_items
FOR ALL TO authenticated
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- Resultado
SELECT '✅ Políticas de acceso público aplicadas correctamente. Ticker, Pizarra y Academia son visibles para todos.' as result;
