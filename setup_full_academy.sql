-- ==============================================================================
-- SCRIPT DE CONFIGURACIÓN COMPLETA PARA ACADEMIA OCTOPUS
-- ==============================================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase para corregir
-- cualquier problema de "Error al guardar" o datos faltantes.

-- 1. Crear la tabla si no existe (con los nombres de columna correctos)
CREATE TABLE IF NOT EXISTS public.recursos_academia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'video', 'plantilla', 'guia'
    url TEXT NOT NULL,
    descripcion TEXT,
    thumbnail_url TEXT,
    es_premium BOOLEAN DEFAULT false
);

-- 2. Habilitar Seguridad (RLS)
ALTER TABLE public.recursos_academia ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad (Permisos)
-- Borrar políticas viejas para evitar duplicados/conflictos
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.recursos_academia;
DROP POLICY IF EXISTS "Permitir insertar a admins" ON public.recursos_academia;
DROP POLICY IF EXISTS "Permitir actualizar a admins" ON public.recursos_academia;
DROP POLICY IF EXISTS "Permitir borrar a admins" ON public.recursos_academia;

-- Política de LECTURA: Todos los usuarios autenticados pueden ver los recursos
CREATE POLICY "Permitir lectura a todos" 
ON public.recursos_academia FOR SELECT 
TO authenticated 
USING (true);

-- PolíticAs de ESCRITURA: Solo los administradores pueden modificar
-- (Asumiendo que existe una tabla 'usuarios' con columna 'role')
CREATE POLICY "Permitir insertar a admins" 
ON public.recursos_academia FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') -- Fallback si usas profiles
);

CREATE POLICY "Permitir actualizar a admins" 
ON public.recursos_academia FOR UPDATE 
TO authenticated 
USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Permitir borrar a admins" 
ON public.recursos_academia FOR DELETE 
TO authenticated 
USING (
  auth.uid() IN (SELECT id FROM public.usuarios WHERE role = 'admin') OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Insertar Datos de Ejemplo (Si faltan)

-- Recurso: CMV (El Video Nuevo)
INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium)
SELECT 'Cómo calcular tu Costo de Mercadería (CMV) Real', 'video', 'https://youtu.be/7k1iPypNCBw', 'Aprende la fórmula exacta para saber cuánto te cuesta cada plato. (Inventario Inicial + Compras - Inventario Final).', false
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Costo de Mercader%');

-- Recurso: Checklist
INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium)
SELECT 'Checklist de Apertura y Cierre', 'plantilla', 'https://docs.google.com/spreadsheets/d/1ExampleSheet/edit', 'Plantilla para estandarizar el inicio y fin del día operativo.', false
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Checklist%');

-- Recurso: Finanzas
INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium)
SELECT 'Finanzas para no Financieros', 'video', 'https://youtu.be/example1', 'Entendé tu estado de resultados en 3 pasos simples.', false
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Finanzas%');

-- Recurso: Operación Blindada (Premium Ejemplo)
INSERT INTO public.recursos_academia (titulo, tipo, url, descripcion, es_premium)
SELECT 'Operación Blindada', 'video', 'https://youtu.be/example2', 'Sistemas para delegar con confianza.', true
WHERE NOT EXISTS (SELECT 1 FROM public.recursos_academia WHERE titulo ILIKE '%Operación Blindada%');
