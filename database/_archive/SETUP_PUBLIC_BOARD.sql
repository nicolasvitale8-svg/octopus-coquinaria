-- 🔥 SETUP_PUBLIC_BOARD.sql 🔥
-- Módulo: Pizarra Pública de Novedades (Web Octopus)

-- 1. Crear el tipo de contenido
DO $$ BEGIN
    CREATE TYPE public_board_item_type AS ENUM ('TIP', 'DESCUENTO', 'NOVEDAD_APP', 'RADAR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear la tabla
CREATE TABLE IF NOT EXISTS public.public_board_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    type public_board_item_type NOT NULL,
    summary VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    priority INTEGER NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)), -- 1=Alta, 2=Media, 3=Baja
    is_visible BOOLEAN DEFAULT true,
    cta_label VARCHAR(50),
    cta_url TEXT,
    tag VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.public_board_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad
-- Lectura pública (Usuarios anónimos o clientes)
-- Regla: Solo si is_visible es true y estamos dentro del rango de fechas.
CREATE POLICY "board_select_public" ON public.public_board_items
FOR SELECT TO public
USING (
    (is_visible = true AND CURRENT_DATE >= start_date AND CURRENT_DATE <= end_date)
    OR
    public.is_admin_or_consultant() -- Admins ven todo para el CMS
);

-- Gestión Admin (Escribir/Borrar)
CREATE POLICY "board_all_admin" ON public.public_board_items
FOR ALL TO authenticated
USING (public.is_admin_or_consultant())
WITH CHECK (public.is_admin_or_consultant());

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_board_items_updated_at
    BEFORE UPDATE ON public.public_board_items
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Indices para performance de filtrado
CREATE INDEX IF NOT EXISTS idx_board_visibility_dates ON public.public_board_items(is_visible, start_date, end_date);

SELECT '✅ Tabla public_board_items creada con éxito.' as result;
