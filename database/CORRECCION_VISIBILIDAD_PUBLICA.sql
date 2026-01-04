-- 🔥 CORRECCION_VISIBILIDAD_PUBLICA.sql 🔥
-- Objetivo: Asegurar que Academia y Calendario sean visibles para todos (anon y auth).

-- 1. Habilitar RLS (por seguridad, es mejor tenerlo activo con políticas claras)
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "v3_academy_select" ON public.recursos_academia;
DROP POLICY IF EXISTS "v3_academy_modify" ON public.recursos_academia;
DROP POLICY IF EXISTS "select_public_calendar" ON public.eventos_calendario;
DROP POLICY IF EXISTS "modify_admin_calendar" ON public.eventos_calendario;

-- 3. Políticas para ACADEMIA (recursos_academia)
-- SELECT: Cualquiera puede ver los recursos (incluyendo anónimos)
CREATE POLICY "recursos_select_public" ON public.recursos_academia
FOR SELECT TO public
USING (true);

-- ALL: Solo Admins y Consultores pueden crear/editar/borrar
CREATE POLICY "recursos_modify_admin" ON public.recursos_academia
FOR ALL TO authenticated
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- 4. Políticas para CALENDARIO (eventos_calendario)
-- SELECT: Cualquiera puede ver los eventos
CREATE POLICY "eventos_select_public" ON public.eventos_calendario
FOR SELECT TO public
USING (true);

-- ALL: Solo Admins y Consultores pueden gestionar
CREATE POLICY "eventos_modify_admin" ON public.eventos_calendario
FOR ALL TO authenticated
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- 5. OPCIONAL: Diagnósticos Express (Leads) - Permitir INSERT público pero SELECT solo admin
-- Esto asegura que los formularios de contacto funcionen sin estar logueado.
ALTER TABLE public.diagnosticos_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "v3_leads_all" ON public.diagnosticos_express;
DROP POLICY IF EXISTS "v3_leads_insert_public" ON public.diagnosticos_express;

CREATE POLICY "leads_insert_public" ON public.diagnosticos_express
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "leads_select_admin" ON public.diagnosticos_express
FOR SELECT TO authenticated
USING (public.is_admin_or_consultant());

SELECT '✅ Visibilidad pública corregida para Academia y Calendario.' as result;
