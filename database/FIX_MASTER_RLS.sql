-- ========================================
-- FIX MAESTRO DE PERMISOS RLS (V4)
-- ========================================
-- Este script arregla TODAS las políticas de seguridad bloqueantes.
-- Ejecutar en Supabase SQL Editor.

-- ==========================================
-- 1. TABLA: project_members (roles/asignación)
-- ==========================================
DROP POLICY IF EXISTS "project_members_select" ON project_members;
DROP POLICY IF EXISTS "project_members_insert" ON project_members;
DROP POLICY IF EXISTS "project_members_update" ON project_members;
DROP POLICY IF EXISTS "project_members_delete" ON project_members;
DROP POLICY IF EXISTS "anon_select_project_members" ON project_members;
DROP POLICY IF EXISTS "auth_all_project_members" ON project_members;

-- Permitir lectura a todos los autenticados
CREATE POLICY "project_members_select" ON project_members
    FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE solo para admins y consultores
CREATE POLICY "project_members_insert" ON project_members
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

CREATE POLICY "project_members_update" ON project_members
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')));

CREATE POLICY "project_members_delete" ON project_members
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')));

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. TABLA: eventos_calendario (calendario)
-- ==========================================
DROP POLICY IF EXISTS "eventos_calendario_select" ON eventos_calendario;
DROP POLICY IF EXISTS "eventos_calendario_insert" ON eventos_calendario;
DROP POLICY IF EXISTS "eventos_calendario_update" ON eventos_calendario;
DROP POLICY IF EXISTS "eventos_calendario_delete" ON eventos_calendario;
DROP POLICY IF EXISTS "anon_select_eventos" ON eventos_calendario;
DROP POLICY IF EXISTS "auth_all_eventos" ON eventos_calendario;

-- Lectura pública (anónimos y autenticados)
CREATE POLICY "eventos_calendario_select" ON eventos_calendario
    FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE solo para admins y consultores
CREATE POLICY "eventos_calendario_insert" ON eventos_calendario
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

CREATE POLICY "eventos_calendario_update" ON eventos_calendario
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')))
    WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')));

CREATE POLICY "eventos_calendario_delete" ON eventos_calendario
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant')));

ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. TABLA: usuarios (perfiles)
-- ==========================================
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;
DROP POLICY IF EXISTS "anon_select_usuarios" ON usuarios;
DROP POLICY IF EXISTS "auth_all_usuarios" ON usuarios;

-- Lectura para todos los autenticados
CREATE POLICY "usuarios_select" ON usuarios
    FOR SELECT TO authenticated USING (true);

-- Edición solo para admins o el propio usuario
CREATE POLICY "usuarios_update" ON usuarios
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        auth.uid() = id
        OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- INSERT solo para admins (creación de usuarios)
CREATE POLICY "usuarios_insert" ON usuarios
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin')
    );

-- DELETE solo para admins
CREATE POLICY "usuarios_delete" ON usuarios
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. TABLA: roles (catálogo de roles)
-- ==========================================
DROP POLICY IF EXISTS "roles_select" ON roles;
CREATE POLICY "roles_select" ON roles FOR SELECT USING (true);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- VERIFICACIÓN
-- ==========================================
SELECT 'project_members' AS tabla, COUNT(*) AS politicas FROM pg_policies WHERE tablename = 'project_members'
UNION ALL
SELECT 'eventos_calendario', COUNT(*) FROM pg_policies WHERE tablename = 'eventos_calendario'
UNION ALL
SELECT 'usuarios', COUNT(*) FROM pg_policies WHERE tablename = 'usuarios'
UNION ALL
SELECT 'roles', COUNT(*) FROM pg_policies WHERE tablename = 'roles';
