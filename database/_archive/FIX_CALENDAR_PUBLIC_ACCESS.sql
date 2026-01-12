-- FIX: Permitir acceso público COMPLETO al calendario
-- El problema es que los usuarios anónimos (anon key) no pueden leer eventos

-- Paso 1: Re-habilitar RLS (necesario para crear políticas)
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

-- Paso 2: Borrar políticas existentes
DROP POLICY IF EXISTS "cal_select_all" ON eventos_calendario;
DROP POLICY IF EXISTS "cal_modify_privileged" ON eventos_calendario;

-- Paso 3: Crear política de lectura PÚBLICA (sin TO authenticated, para TODOS)
CREATE POLICY "calendar_public_read" ON eventos_calendario
    FOR SELECT
    USING (true);  -- Permite a CUALQUIERA (incluido anon) leer

-- Paso 4: Crear política de modificación solo para autenticados admin/consultant
CREATE POLICY "calendar_admin_write" ON eventos_calendario
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

-- Verificar
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'eventos_calendario';

-- Contar eventos
SELECT COUNT(*) as total_eventos FROM eventos_calendario;
