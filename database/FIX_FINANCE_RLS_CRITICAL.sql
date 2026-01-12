-- ==============================================================================
-- 🔒 FIX CRÍTICO: RLS PARA TABLAS FINANCIERAS
-- Fecha: 2026-01-12
-- Problema: Usuario cliente puede ver datos financieros de otros usuarios
-- ==============================================================================

-- 1. RECREAR FUNCIÓN DE ACCESO A DATOS FINANCIEROS
-- Esta función verifica si el usuario puede acceder a los datos
CREATE OR REPLACE FUNCTION public.can_access_fin_data(target_user_id UUID, target_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    current_role TEXT;
BEGIN
    current_user_id := auth.uid();
    
    -- Si no hay usuario autenticado, denegar
    IF current_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Regla 1: Si es el mismo usuario (datos personales), permitir
    IF current_user_id = target_user_id THEN
        RETURN TRUE;
    END IF;

    -- Regla 2: Si es admin, permitir todo
    SELECT role INTO current_role FROM public.usuarios WHERE id = current_user_id;
    IF current_role = 'admin' THEN
        RETURN TRUE;
    END IF;

    -- Regla 3: Si el dato pertenece a un negocio y el usuario es miembro, permitir
    IF target_business_id IS NOT NULL THEN
        RETURN EXISTS (
            SELECT 1 FROM public.business_memberships 
            WHERE business_id = target_business_id AND user_id = current_user_id
        );
    END IF;

    -- Por defecto, denegar
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APLICAR RLS A TODAS LAS TABLAS fin_*
-- Primero habilitamos RLS en todas

ALTER TABLE public.fin_account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_rules ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES Y CREAR NUEVAS SEGURAS

-- FIN_ACCOUNT_TYPES
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_account_types;
DROP POLICY IF EXISTS "fin_account_types_access" ON public.fin_account_types;
CREATE POLICY "fin_account_types_access" ON public.fin_account_types
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_ACCOUNTS
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_accounts;
DROP POLICY IF EXISTS "fin_accounts_access" ON public.fin_accounts;
CREATE POLICY "fin_accounts_access" ON public.fin_accounts
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_MONTHLY_BALANCES
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_monthly_balances;
DROP POLICY IF EXISTS "fin_monthly_balances_access" ON public.fin_monthly_balances;
CREATE POLICY "fin_monthly_balances_access" ON public.fin_monthly_balances
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_CATEGORIES
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_categories;
DROP POLICY IF EXISTS "fin_categories_access" ON public.fin_categories;
CREATE POLICY "fin_categories_access" ON public.fin_categories
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_SUBCATEGORIES
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_subcategories;
DROP POLICY IF EXISTS "fin_subcategories_access" ON public.fin_subcategories;
CREATE POLICY "fin_subcategories_access" ON public.fin_subcategories
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_TRANSACTIONS
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_transactions;
DROP POLICY IF EXISTS "fin_transactions_access" ON public.fin_transactions;
CREATE POLICY "fin_transactions_access" ON public.fin_transactions
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_BUDGET_ITEMS
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_budget_items;
DROP POLICY IF EXISTS "fin_budget_items_access" ON public.fin_budget_items;
CREATE POLICY "fin_budget_items_access" ON public.fin_budget_items
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_JARS
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_jars;
DROP POLICY IF EXISTS "fin_jars_access" ON public.fin_jars;
CREATE POLICY "fin_jars_access" ON public.fin_jars
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- FIN_RULES
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_rules;
DROP POLICY IF EXISTS "fin_rules_access" ON public.fin_rules;
CREATE POLICY "fin_rules_access" ON public.fin_rules
FOR ALL USING (public.can_access_fin_data(user_id, business_id));

-- 4. VERIFICAR QUE LAS POLÍTICAS EXISTEN
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename LIKE 'fin_%'
ORDER BY tablename;

SELECT '✅ RLS FINANCIERO CORREGIDO - Cada usuario solo verá SUS datos' as status;
