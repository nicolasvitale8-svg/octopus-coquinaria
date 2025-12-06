-- ==============================================================================
-- SCRIPT MAESTRO DE REPARACIÓN DE BASE DE DATOS - OCTOPUS
-- ==============================================================================
-- Ejecuta esto en Supabase > SQL Editor para arreglar:
-- 1. "No guarda fechas" (Crea tabla calendario + permisos)
-- 2. "No guarda recursos" (Crea tabla academia + permisos)
-- 3. "Error de roles" (Asegura permisos de usuarios)

-- --- PARTE 1: CALENDARIO COMERCIAL ---
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'feriado', 'comercial', 'interno'
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    mensaje TEXT
);

ALTER TABLE public.eventos_calendario ENABLE ROW LEVEL SECURITY;

-- Borrar políticas viejas de calendario
DROP POLICY IF EXISTS "Lectura Calendario" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Escritura Calendario Admin" ON public.eventos_calendario;

-- Crear políticas calendario
CREATE POLICY "Lectura Calendario" ON public.eventos_calendario FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura Calendario Admin" ON public.eventos_calendario FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);


-- --- PARTE 2: ACADEMIA OCTOPUS ---
CREATE TABLE IF NOT EXISTS public.recursos_academia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    url TEXT NOT NULL,
    descripcion TEXT,
    thumbnail_url TEXT,
    es_premium BOOLEAN DEFAULT false
);

ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;

-- Borrar políticas viejas de academia
DROP POLICY IF EXISTS "Lectura Academia" ON public.recursos_academia;
DROP POLICY IF EXISTS "Escritura Academia Admin" ON public.recursos_academia;

-- Crear políticas academia
CREATE POLICY "Lectura Academia" ON public.recursos_academia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Escritura Academia Admin" ON public.recursos_academia FOR ALL TO authenticated USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- --- PARTE 3: GESTIÓN DE USUARIOS (Permite al Admin editar roles) ---
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Asegurar que el admin puede leer y actualizar usuarios
DROP POLICY IF EXISTS "Admin Gestionar Usuarios" ON public.usuarios;

CREATE POLICY "Admin Gestionar Usuarios" ON public.usuarios FOR ALL TO authenticated USING (
    -- El usuario es el mismo (leerse a si mismo)
    auth.uid() = id 
    OR 
    -- O el usuario es admin (puede leer/editar todo)
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role = 'admin')
);

-- --- PARTE 4: DATOS DE EJEMPLO (Solo si faltan) ---

-- Insertar Video CMV
INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium)
SELECT 'Cómo calcular tu Costo de Mercadería (CMV) Real', 'video', 'https://youtu.be/7k1iPypNCBw', 'Fórmula exacta para saber cuánto te cuesta cada plato.', false
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Costo de Mercader%');

-- Insertar Feriado Ejemplo
INSERT INTO public.eventos_calendario (titulo, tipo, fecha_inicio, fecha_fin, mensaje)
SELECT 'Feriado Inmaculada Concepción', 'feriado', NOW(), NOW(), 'Ejemplo post feriado'
WHERE NOT EXISTS (SELECT 1 FROM public.eventos_calendario WHERE titulo ILIKE '%Inmaculada%');

