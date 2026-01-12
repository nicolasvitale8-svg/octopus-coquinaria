-- EMERGENCY RESTORE SCRIPT
-- Purpose: Disable Row Level Security on ALL finance tables to immediately restore data visibility.
-- This reverts the security layer to the state where "everything flows" and frontend handles filtering.

BEGIN;

-- 1. New Table
ALTER TABLE public.finance_cheques DISABLE ROW LEVEL SECURITY;

-- 2. Legacy Tables (Core)
ALTER TABLE public.fin_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_budget_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_jars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_account_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_monthly_balances DISABLE ROW LEVEL SECURITY;

-- 3. Categories & Rules
ALTER TABLE public.fin_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_subcategories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_rules DISABLE ROW LEVEL SECURITY;

COMMIT;

-- Verification:
-- After running this, all data should be visible immediately in the Dashboard and Cash Flow.
