-- RLS FIX FOR ALL FINANCE MODULES (FINAL v3)
-- Purpose: Restore access to financial data for Admins and Project Members.
-- Corrections:
-- finance_cheques uses 'project_id'
-- fin_accounts, fin_transactions, etc. use 'business_id'

-- 1. FINANCE CHEQUES (New Table -> Uses project_id)
ALTER TABLE public.finance_cheques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for project members" ON public.finance_cheques;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.finance_cheques;
DROP POLICY IF EXISTS "Finance Cheques Access Policy" ON public.finance_cheques;

CREATE POLICY "Finance Cheques Access Policy" ON public.finance_cheques
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        project_id IS NULL
    )
    WITH CHECK (
        (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        project_id IS NULL
    );

-- 2. FINANCE ACCOUNTS (fin_accounts -> Uses business_id)
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance Accounts Access" ON public.fin_accounts;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fin_accounts;
DROP POLICY IF EXISTS "Finance Accounts Access Policy" ON public.fin_accounts;

CREATE POLICY "Finance Accounts Access Policy" ON public.fin_accounts
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        business_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        business_id IS NULL
    )
    WITH CHECK (true);

-- 3. FINANCE TRANSACTIONS (fin_transactions -> Uses business_id)
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance Transactions Access" ON public.fin_transactions;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fin_transactions;
DROP POLICY IF EXISTS "Finance Transactions Access Policy" ON public.fin_transactions;

CREATE POLICY "Finance Transactions Access Policy" ON public.fin_transactions
    FOR ALL
    TO authenticated
    USING (
         (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        business_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        business_id IS NULL
    )
    WITH CHECK (true);

-- 4. FINANCE BUDGET ITEMS (fin_budget_items -> Uses business_id)
ALTER TABLE public.fin_budget_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance Budget Access" ON public.fin_budget_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fin_budget_items;
DROP POLICY IF EXISTS "Finance Budget Access Policy" ON public.fin_budget_items;

CREATE POLICY "Finance Budget Access Policy" ON public.fin_budget_items
    FOR ALL
    TO authenticated
    USING (
         (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        business_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        business_id IS NULL
    )
    WITH CHECK (true);

-- 5. FINANCE JARS / GOALS (fin_jars -> Uses business_id)
ALTER TABLE public.fin_jars ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance Goals Access" ON public.fin_jars;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.fin_jars;
DROP POLICY IF EXISTS "Finance Goals Access Policy" ON public.fin_jars;

CREATE POLICY "Finance Goals Access Policy" ON public.fin_jars
    FOR ALL
    TO authenticated
    USING (
         (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin'
        OR
        business_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
        OR
        business_id IS NULL
    )
    WITH CHECK (true);
