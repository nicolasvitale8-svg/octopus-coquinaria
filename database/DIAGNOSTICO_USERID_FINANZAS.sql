-- ==============================================================================
-- 🔍 DIAGNÓSTICO Y CORRECCIÓN DE user_id EN TABLAS FINANCIERAS
-- Fecha: 2026-01-12
-- ==============================================================================

-- PASO 1: DIAGNÓSTICO - Ver cuántos registros tienen user_id NULL
SELECT 'fin_accounts' as tabla, COUNT(*) as total, COUNT(user_id) as con_user_id, COUNT(*) - COUNT(user_id) as sin_user_id FROM fin_accounts
UNION ALL
SELECT 'fin_transactions', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM fin_transactions
UNION ALL
SELECT 'fin_budget_items', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM fin_budget_items
UNION ALL
SELECT 'fin_categories', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM fin_categories
UNION ALL
SELECT 'fin_jars', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM fin_jars
UNION ALL
SELECT 'fin_monthly_balances', COUNT(*), COUNT(user_id), COUNT(*) - COUNT(user_id) FROM fin_monthly_balances;

-- PASO 2: Ver el ID del admin (Nicolás)
SELECT id, email, role FROM public.usuarios WHERE email = 'nicolasvitale8@gmail.com';

-- PASO 3: CORRECCIÓN - Asignar todos los datos SIN user_id al admin
-- (Asumiendo que los datos sin user_id son de Nicolás)

-- Obtener el ID de Nicolás
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM public.usuarios WHERE email = 'nicolasvitale8@gmail.com';
    
    IF admin_id IS NOT NULL THEN
        -- Actualizar todas las tablas fin_* donde user_id es NULL
        UPDATE public.fin_accounts SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_transactions SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_budget_items SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_categories SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_subcategories SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_jars SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_monthly_balances SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_rules SET user_id = admin_id WHERE user_id IS NULL;
        UPDATE public.fin_account_types SET user_id = admin_id WHERE user_id IS NULL;
        
        RAISE NOTICE '✅ Datos actualizados con user_id del admin: %', admin_id;
    ELSE
        RAISE EXCEPTION '❌ No se encontró el usuario admin';
    END IF;
END $$;

-- PASO 4: VERIFICAR que ahora todos los registros tienen user_id
SELECT 'DESPUÉS DE CORRECCIÓN' as estado;
SELECT 'fin_accounts' as tabla, COUNT(*) as total, COUNT(user_id) as con_user_id FROM fin_accounts
UNION ALL
SELECT 'fin_transactions', COUNT(*), COUNT(user_id) FROM fin_transactions
UNION ALL
SELECT 'fin_budget_items', COUNT(*), COUNT(user_id) FROM fin_budget_items;

-- PASO 5: Verificar que la política funciona
-- Esta consulta debería mostrar las políticas activas
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'fin_%';

SELECT '✅ DIAGNÓSTICO Y CORRECCIÓN COMPLETADOS' as status;
