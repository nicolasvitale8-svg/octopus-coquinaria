
-- ==============================================================================
-- 🐙 RESTAURAR SEGURIDAD (RLS)
-- Cierra el acceso público y vuelve a proteger los datos.
-- Ejecuta esto SOLO DESPUÉS de confirmar que puedes entrar con tu email.
-- ==============================================================================

-- 1. Re-activar RLS en todas las tablas fin_*
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_monthly_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_jars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_rules ENABLE ROW LEVEL SECURITY;

-- 2. Revocar permisos al rol anónimo (anon)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 3. Asegurar que el rol 'authenticated' (usuarios logueados) siga teniendo acceso base
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- NOTA: Las políticas de acceso seguirán funcionando porque ya existen
-- (usan la función can_access_fin_data que valida el ID del usuario logueado)
