
-- ==========================================
-- SCRIPT DE REASIGNACIÓN DE IDENTIDAD (UID) - V2
-- Nicolas: Ejecuta esto para ver tus datos YA.
-- ==========================================

-- 0. DIAGNÓSTICO PREVIO
SELECT count(*) as transacciones_con_id_viejo FROM public.fin_transactions WHERE user_id = '9427762f-2b79-4b2a-a728-5163040c0054';

-- 1. Insertamos o actualizamos tu perfil real
INSERT INTO public.usuarios (id, email, full_name, role, plan)
VALUES ('dc1e06af-002f-46ec-900c-c6bef40af35e', 'nicolasvitale8@gmail.com', 'Nicolás Vitale', 'admin', 'PRO')
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'admin';

-- 2. Reasignamos todos tus datos financieros al ID real de tu sesión
-- También nos aseguramos que business_id sea NULL para que aparezcan en "Caja Personal"
UPDATE public.fin_accounts SET user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e', business_id = NULL;
UPDATE public.fin_transactions SET user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e', business_id = NULL;
UPDATE public.fin_budget_items SET user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e', business_id = NULL;
UPDATE public.fin_categories SET user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e', business_id = NULL;
UPDATE public.fin_subcategories SET user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e', business_id = NULL;

-- 3. Limpieza: Borramos el usuario "fantasma" que tenía el ID viejo
DELETE FROM public.usuarios WHERE id = '9427762f-2b79-4b2a-a728-5163040c0054' AND email = 'nicolasvitale8@gmail.com';

-- VERIFICACIÓN FINAL
SELECT 
    (SELECT count(*) FROM public.fin_transactions WHERE user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e') as mis_transacciones,
    (SELECT count(*) FROM public.fin_accounts WHERE user_id = 'dc1e06af-002f-46ec-900c-c6bef40af35e') as mis_cuentas,
    (SELECT role FROM public.usuarios WHERE id = 'dc1e06af-002f-46ec-900c-c6bef40af35e') as mi_rol_actual;
