-- SCRIPT V3.10: FIX RLS POLICIES (SOLUCIÓN DEFINITIVA DE VISIBILIDAD)
-- PROPÓSITO: Eliminar cualquier bloqueo zombie y garantizar que el ADMIN pueda verse a sí mismo y a otros.

-- 1. Desactivar RLS temporalmente para limpiar
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- 2. BORRADO MASIVO DE POLÍTICAS (Para asegurar pizarra limpia)
DROP POLICY IF EXISTS "Admins and Consultants can view all" ON public.usuarios;
DROP POLICY IF EXISTS "Admins/Consultants view all" ON public.usuarios;
DROP POLICY IF EXISTS "Perfiles publicos visibles por todos." ON public.usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own profile" ON public.usuarios;
DROP POLICY IF EXISTS "v3_final_read" ON public.usuarios;
DROP POLICY IF EXISTS "v3_final_update" ON public.usuarios;
DROP POLICY IF EXISTS "v3_final_insert" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_select_own" ON public.usuarios;
DROP POLICY IF EXISTS "v3_users_select_admin" ON public.usuarios;

-- 3. CREAR LA POLÍTICA MAESTRA DE LECTURA (SIMPLE Y PODEROSA)
CREATE POLICY "v3_10_read_policy" ON public.usuarios FOR SELECT
USING (
    -- Regla 1: El usuario puede ver su propio perfil
    auth.uid() = id
    OR
    -- Regla 2: Permisos de Admin (Hardcoded por seguridad + Metadata)
    auth.email() ILIKE 'nicolasvitale8@gmail.com'
    OR
    (SELECT (raw_app_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid())
);

-- 4. POLÍTICA DE ACTUALIZACIÓN (Para que puedas editar usuarios)
CREATE POLICY "v3_10_update_policy" ON public.usuarios FOR UPDATE
USING (
    auth.uid() = id
    OR
    auth.email() ILIKE 'nicolasvitale8@gmail.com'
    OR
    (SELECT (raw_app_meta_data->>'role') = 'admin' FROM auth.users WHERE id = auth.uid())
);

-- 5. POLÍTICA DE INSERCIÓN (Para nuevos usuarios)
CREATE POLICY "v3_10_insert_policy" ON public.usuarios FOR INSERT
WITH CHECK (true); -- Permitir creación (AuthContext lo maneja)

-- 6. REACTIVAR SEGURIDAD
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- 7. DIAGNÓSTICO FINAL
SELECT 'V3.10 APLICADO: POLÍTICAS RLS REINICIADAS Y SIMPLIFICADAS.' as status;
