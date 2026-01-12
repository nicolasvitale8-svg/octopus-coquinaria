-- ========================================
-- EMERGENCY FIX: RLS COMPLETE RESET (V5)
-- ========================================
-- Este script:
-- 1. Deshabilita RLS en las tablas problemáticas
-- 2. Borra TODAS las políticas existentes
-- 3. Crea políticas nuevas permisivas
-- 4. Rehabilita RLS
-- 
-- Ejecutar COMPLETO en Supabase SQL Editor

-- ============================================
-- PASO 1: DESHABILITAR RLS TEMPORALMENTE
-- ============================================
ALTER TABLE project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 2: ELIMINAR TODAS LAS POLÍTICAS
-- ============================================

-- project_members
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'project_members'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_members', pol.policyname);
    END LOOP;
END $$;

-- eventos_calendario
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'eventos_calendario'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON eventos_calendario', pol.policyname);
    END LOOP;
END $$;

-- projects
DO $$ 
DECLARE pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON projects', pol.policyname);
    END LOOP;
END $$;

-- ============================================
-- PASO 3: CREAR POLÍTICAS PERMISIVAS
-- ============================================

-- project_members: Todos autenticados pueden leer, admins/consultants modificar
CREATE POLICY "pm_select_all" ON project_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "pm_modify_privileged" ON project_members
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

-- eventos_calendario: Lectura pública, modificación privilegiada
CREATE POLICY "cal_select_all" ON eventos_calendario
    FOR SELECT USING (true);

CREATE POLICY "cal_modify_privileged" ON eventos_calendario
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

-- projects: Todos autenticados pueden leer, admins/consultants modificar
CREATE POLICY "proj_select_all" ON projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "proj_modify_privileged" ON projects
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'consultant'))
    );

-- ============================================
-- PASO 4: REHABILITAR RLS
-- ============================================
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 5: VERIFICACIÓN
-- ============================================
SELECT 'Políticas creadas:' AS status;

SELECT tablename, count(*) as politicas 
FROM pg_policies 
WHERE tablename IN ('project_members', 'eventos_calendario', 'projects')
GROUP BY tablename;

SELECT 'Eventos en calendario:' AS check, COUNT(*) as total FROM eventos_calendario;
SELECT 'Membresías de proyecto:' AS check, COUNT(*) as total FROM project_members;

-- Verificar membresías de Juan Pablo específicamente
SELECT 'Membresías de juanpablogerchunoff:' AS check,
       pm.user_id, pm.project_id, p.business_name, r.name as rol
FROM project_members pm
JOIN projects p ON pm.project_id = p.id
JOIN roles r ON pm.role_id = r.id
JOIN usuarios u ON pm.user_id = u.id
WHERE u.email = 'juanpablogerchunoff@gmail.com';
