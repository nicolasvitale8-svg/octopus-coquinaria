-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DEFINITIVA: RECURSIÓN RLS Y PERMISOS ADMIN
-- ==============================================================================

-- 1. Función segura para verificar si soy Admin (Rompe el bucle de recursión)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER es la clave para saltar RLS

-- ==============================================================================
-- 2. Arreglar Tabla USUARIOS (Permite ver y editar roles)
-- ==============================================================================
DROP POLICY IF EXISTS "Admin Gestionar Usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Lectura General Usuarios" ON public.usuarios;

-- Admin Total: Puede ver y editar todo
CREATE POLICY "Admin Gestionar Usuarios" ON public.usuarios
FOR ALL TO authenticated
USING (
  is_admin() OR auth.uid() = id
)
WITH CHECK (
  is_admin() OR auth.uid() = id
);

-- Nota: La política de arriba cubre tanto admin como usuario propio. 
-- Simplificamos para evitar conflictos.

-- ==============================================================================
-- 3. Arreglar Tabla CALENDARIO (Permite guardar eventos)
-- ==============================================================================
DROP POLICY IF EXISTS "Admin Gestionar Calendario" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Lectura Calendario" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Admin All" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Escritura Calendario Admin" ON public.eventos_calendario;

-- Admin Total
CREATE POLICY "Admin Gestionar Calendario" ON public.eventos_calendario
FOR ALL TO authenticated
USING (is_admin());

-- Lectura para Todos (Autenticados)
CREATE POLICY "Lectura Calendario" ON public.eventos_calendario
FOR SELECT TO authenticated
USING (true);

-- ==============================================================================
-- 4. Arreglar Tabla ACADEMIA (Permite guardar recursos/videos)
-- ==============================================================================
DROP POLICY IF EXISTS "Admin Gestionar Academia" ON public.recursos_academia;
DROP POLICY IF EXISTS "Lectura Academia" ON public.recursos_academia;
DROP POLICY IF EXISTS "Admin All Academy" ON public.recursos_academia;
DROP POLICY IF EXISTS "Admins Insertar" ON public.recursos_academia;

-- Admin Total
CREATE POLICY "Admin Gestionar Academia" ON public.recursos_academia
FOR ALL TO authenticated
USING (is_admin());

-- Lectura para Todos (Autenticados)
CREATE POLICY "Lectura Academia" ON public.recursos_academia
FOR SELECT TO authenticated
USING (true);
