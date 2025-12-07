-- ==============================================================================
-- SCRIPT DE CORRECCIÓN DE EMERGENCIA: RECURSIÓN RLS
-- ==============================================================================
-- Ejecuta esto para solucionar el problema de "Base de datos vacía".
-- El problema fue un "bucle infinito" de seguridad: para ver si eras admin,
-- la base de datos intentaba leerse a sí misma, bloqueando el acceso.

-- 1. Función segura para verificar si soy Admin (Rompe el bucle)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Arreglar Tabla USUARIOS
DROP POLICY IF EXISTS "Admin Gestionar Usuarios" ON public.usuarios;
-- Política correcta:
CREATE POLICY "Admin Gestionar Usuarios" ON public.usuarios
FOR ALL TO authenticated
USING (
  auth.uid() = id -- Cada uno se ve a sí mismo
  OR
  is_admin() -- El admin ve a todos usando la función segura
);

-- 3. Arreglar Tabla CALENDARIO
DROP POLICY IF EXISTS "Admin All" ON public.eventos_calendario;
DROP POLICY IF EXISTS "Escritura Calendario Admin" ON public.eventos_calendario;
-- Admin total, usuarios solo lectura
CREATE POLICY "Admin Gestionar Calendario" ON public.eventos_calendario FOR ALL TO authenticated USING (is_admin());
-- Re-asegurar lectura para todos (si faltaba)
DROP POLICY IF EXISTS "Lectura Calendario" ON public.eventos_calendario;
CREATE POLICY "Lectura Calendario" ON public.eventos_calendario FOR SELECT TO authenticated USING (true);


-- 4. Arreglar Tabla ACADEMIA
DROP POLICY IF EXISTS "Admin All Academy" ON public.recursos_academia;
DROP POLICY IF EXISTS "Admins Insertar" ON public.recursos_academia;
DROP POLICY IF EXISTS "Escritura Academia Admin" ON public.recursos_academia;
-- Admin total
CREATE POLICY "Admin Gestionar Academia" ON public.recursos_academia FOR ALL TO authenticated USING (is_admin());
-- Re-asegurar lectura para todos
DROP POLICY IF EXISTS "Permitir lectura a todos" ON public.recursos_academia;
DROP POLICY IF EXISTS "Lectura Academia" ON public.recursos_academia;
CREATE POLICY "Lectura Academia" ON public.recursos_academia FOR SELECT TO authenticated USING (true);
