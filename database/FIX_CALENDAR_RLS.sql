-- ========================================
-- FIX CALENDARIO COMPLETO
-- ========================================
-- Ejecutar si el calendario público no muestra todos los eventos

-- 1. Eliminar TODAS las políticas existentes de eventos_calendario
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'eventos_calendario'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON eventos_calendario', pol.policyname);
    END LOOP;
END $$;

-- 2. Crear política simple de lectura pública
CREATE POLICY "public_read_all_events" ON eventos_calendario
    FOR SELECT USING (true);

-- 3. Crear política de escritura para admins/consultants
CREATE POLICY "admin_write_events" ON eventos_calendario
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')));

-- 4. Habilitar RLS
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

-- 5. Verificar cantidad de eventos
SELECT COUNT(*) as total_eventos FROM eventos_calendario;

-- 6. Ver políticas actuales
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'eventos_calendario';
