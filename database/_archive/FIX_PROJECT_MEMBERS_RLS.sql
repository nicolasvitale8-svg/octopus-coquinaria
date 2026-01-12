-- ========================================
-- FIX RLS POLICIES FOR project_members
-- ========================================
-- Este script arregla las políticas de seguridad que bloquean
-- la gestión de miembros del proyecto por parte de administradores.

-- 1. Eliminar políticas existentes restrictivas
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;

-- 2. Crear política de SELECT: todos los usuarios autenticados pueden ver miembros
CREATE POLICY "project_members_select" ON project_members
    FOR SELECT
    TO authenticated
    USING (true);

-- 3. Crear política de INSERT: solo admins pueden agregar miembros
CREATE POLICY "project_members_insert" ON project_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.role IN ('admin', 'consultant')
        )
    );

-- 4. Crear política de UPDATE: solo admins pueden modificar roles
CREATE POLICY "project_members_update" ON project_members
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.role IN ('admin', 'consultant')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.role IN ('admin', 'consultant')
        )
    );

-- 5. Crear política de DELETE: solo admins pueden eliminar miembros
CREATE POLICY "project_members_delete" ON project_members
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.role IN ('admin', 'consultant')
        )
    );

-- 6. Verificar que RLS está habilitado
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Después de ejecutar, verifica con:
-- SELECT * FROM pg_policies WHERE tablename = 'project_members';
