-- 🛡️ FINANZAFLOW PRIVACY ENFORCEMENT 🛡️
-- Ensures that personal finances (business_id IS NULL) are ONLY visible to the owner.
-- Business finances are visible to owners, admins and allowed collaborators.

-- 1. Redefinir la función de acceso con reglas estrictas de privacidad
CREATE OR REPLACE FUNCTION public.can_access_fin_data(target_user_id uuid, target_business_id uuid)
RETURNS boolean AS $$
BEGIN
    -- Caso 1: Finanzas Personales (Aislamiento Total)
    IF target_business_id IS NULL THEN
        RETURN (auth.uid() = target_user_id);
    END IF;

    -- Caso 2: Finanzas de Unidad de Negocio / Proyecto
    RETURN (
        auth.uid() = target_user_id -- Dueño original
        OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin' -- Admin global
        OR EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = target_business_id 
            AND user_id = auth.uid()
        ) -- Miembro del proyecto (V4)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que todas las tablas fin_* tengan habilitada la RLS
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'fin_%' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- 3. Re-aplicar la política de acceso a todas las tablas fin_*
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'fin_%' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "fin_access_policy" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "fin_access_policy" ON public.%I FOR ALL USING (public.can_access_fin_data(user_id, business_id));', t);
    END LOOP;
END $$;

SELECT '✅ Privacidad de FinanzaFlow reforzada. Los datos personales ahora son privados del usuario.' as status;
