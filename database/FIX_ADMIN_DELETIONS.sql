-- ==============================================================================
-- 🐙 FIX ADMIN DELETIONS
-- Objetivo: Asegurar que el Administrador pueda borrar Notas y Tareas
-- ==============================================================================

-- 1. Permisos para Notas del Proyecto (project_notes)
-- ------------------------------------------------------------------------------
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- Política de Borrado para Notas
DROP POLICY IF EXISTS "notes_delete_policy" ON public.project_notes;
CREATE POLICY "notes_delete_policy" ON public.project_notes FOR DELETE
USING (public.is_admin_or_consultant());

-- 2. Permisos para Tareas (tasks)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "task_delete_policy" ON public.tasks;
CREATE POLICY "task_delete_policy" ON public.tasks FOR DELETE
USING (public.is_admin_or_consultant());

-- 3. Verificación de permisos extendidos por email (Failsafe)
-- ------------------------------------------------------------------------------
-- La función is_admin_or_consultant() ya contempla el email nicolasvitale8@gmail.com como admin total.

SELECT '✅ POLÍTICAS DE BORRADO ACTUALIZADAS. El Administrador ya puede eliminar Notas y Tareas.' as status;
