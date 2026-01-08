-- SCHEMA FOR FINANZAFLOW SUPABASE - V2 (Multi-Box Support)
-- Integrated with Octopus Business Structure

-- 1. Account Types
CREATE TABLE IF NOT EXISTS public.fin_account_types (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    include_in_cashflow BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE, -- Optional: for business-specific types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Accounts (Cajas)
CREATE TABLE IF NOT EXISTS public.fin_accounts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    account_type_id TEXT REFERENCES public.fin_account_types(id),
    currency TEXT DEFAULT 'ARS',
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE, -- NULL = Personal, Set = Business Box
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.fin_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('IN', 'OUT', 'MIX')),
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Subcategories
CREATE TABLE IF NOT EXISTS public.fin_subcategories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    category_id TEXT REFERENCES public.fin_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Monthly Balances
CREATE TABLE IF NOT EXISTS public.fin_monthly_balances (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT REFERENCES public.fin_accounts(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 0-11
    amount NUMERIC(15,2) DEFAULT 0,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(account_id, year, month)
);

-- 6. Transactions
CREATE TABLE IF NOT EXISTS public.fin_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    date DATE NOT NULL,
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    description TEXT,
    note TEXT,
    amount NUMERIC(15,2) NOT NULL,
    type TEXT CHECK (type IN ('IN', 'OUT')),
    account_id TEXT REFERENCES public.fin_accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Budget Items
CREATE TABLE IF NOT EXISTS public.fin_budget_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    label TEXT,
    type TEXT CHECK (type IN ('IN', 'OUT')),
    planned_amount NUMERIC(15,2) NOT NULL,
    planned_date INTEGER, -- Day of month
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Jars (Savings Goals / Investments)
CREATE TABLE IF NOT EXISTS public.fin_jars (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id TEXT REFERENCES public.fin_accounts(id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    principal NUMERIC(15,2) NOT NULL,
    annual_rate NUMERIC(10,4) NOT NULL, -- percentage
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Text Category Rules
CREATE TABLE IF NOT EXISTS public.fin_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    pattern TEXT NOT NULL,
    match_type TEXT CHECK (match_type IN ('contains', 'equals', 'startsWith')),
    category_id TEXT REFERENCES public.fin_categories(id),
    sub_category_id TEXT REFERENCES public.fin_subcategories(id),
    direction TEXT CHECK (direction IN ('IN', 'OUT')),
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'fin_%' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    END LOOP;
END $$;

-- Policies for Multi-Tenancy (Personal + Business)
-- A user can access if:
-- 1. user_id matches auth.uid() (Personal)
-- 2. user is an admin
-- 3. user is a member of the business (Business Box)

CREATE OR REPLACE FUNCTION public.can_access_fin_data(target_user_id uuid, target_business_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN (
        auth.uid() = target_user_id -- Personal
        OR (SELECT role FROM public.usuarios WHERE id = auth.uid()) = 'admin' -- Admin access all
        OR (
            target_business_id IS NOT NULL 
            AND EXISTS (SELECT 1 FROM public.business_memberships WHERE business_id = target_business_id AND user_id = auth.uid()) -- Member
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply generic policy to all fin_ tables
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'fin_%' LOOP
        EXECUTE format('DROP POLICY IF EXISTS "fin_access_policy" ON public.%I;', t);
        EXECUTE format('CREATE POLICY "fin_access_policy" ON public.%I FOR ALL USING (public.can_access_fin_data(user_id, business_id));', t);
    END LOOP;
END $$;
