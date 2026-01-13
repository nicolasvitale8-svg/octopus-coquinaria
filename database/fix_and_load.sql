
-- 1. PARCHE DE INTEGRIDAD (NECESARIO PARA QUE LOS INSERT FUNCIONEN)
DO $$ 
DECLARE 
    t text;
    c text;
BEGIN
    FOR t, c IN 
        SELECT table_name, constraint_name 
        FROM information_schema.key_column_usage 
        WHERE column_name = 'user_id' AND table_name LIKE 'fin_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I;', t, c);
    END LOOP;
END $$;

DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' AND tablename LIKE 'fin_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;', t, t);
    END LOOP;
END $$;

-- 2. CARGA DE DATOS (NOVIEMBRE 2025)
-- Cuentas
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('52f1843c-6a02-437e-9f7f-47ae2ce4537e', 'CTA NARANJA', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('505cb2fd-cc86-42af-aa51-eed5e53c23b5', 'CTA. MERCP', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('00c73bd9-13c8-4da8-8099-fdd4314ea33b', 'CTA PERSONAL PAY', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('8edfd4b2-3831-4079-841f-b66bb42692c4', 'EFECTIVO', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('4854aa36-7db9-444f-a25c-f9e54742db3d', 'CTA TUENTI', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_accounts (id, name, is_active, user_id) VALUES ('5163231a-aca7-42e2-86e9-648e3c57709c', 'CTA CP', true, '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;

-- Categorías y Subcategorías (Octubre/Noviembre)
INSERT INTO public.fin_categories (id, name, type, user_id) VALUES ('cfab005c-a9ca-4e53-9ac7-92e38a84312c', 'SUSCRIPCIONES', 'OUT', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_subcategories (id, category_id, name, user_id) VALUES ('0ca96dcd-557e-418a-8ca0-3baf251b491a', 'cfab005c-a9ca-4e53-9ac7-92e38a84312c', 'CHAT GPT', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date, user_id) VALUES (2025, 10, 'cfab005c-a9ca-4e53-9ac7-92e38a84312c', '0ca96dcd-557e-418a-8ca0-3baf251b491a', 'CHAT GPT', 'OUT', 38613.97, 3, '9427762f-2b79-4b2a-a728-5163040c0054');
INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id, user_id) VALUES ('2025-11-03', 'cfab005c-a9ca-4e53-9ac7-92e38a84312c', '0ca96dcd-557e-418a-8ca0-3baf251b491a', 'CHAT GPT', 37737.38, 'OUT', '8edfd4b2-3831-4079-841f-b66bb42692c4', '9427762f-2b79-4b2a-a728-5163040c0054');

INSERT INTO public.fin_categories (id, name, type, user_id) VALUES ('ac1ee18a-0690-4e52-88ba-159167ad3b55', 'INGRESOS', 'IN', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_subcategories (id, category_id, name, user_id) VALUES ('fdc3d105-f5ac-4e2f-9eb2-37beb272892a', 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'SUELDO QALA', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date, user_id) VALUES (2025, 10, 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'fdc3d105-f5ac-4e2f-9eb2-37beb272892a', 'SUELDO QALA', 'IN', 1418000, 3, '9427762f-2b79-4b2a-a728-5163040c0054');
INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id, user_id) VALUES ('2025-11-03', 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'fdc3d105-f5ac-4e2f-9eb2-37beb272892a', 'SUELDO QALA', 1418000, 'IN', '8edfd4b2-3831-4079-841f-b66bb42692c4', '9427762f-2b79-4b2a-a728-5163040c0054');

INSERT INTO public.fin_subcategories (id, category_id, name, user_id) VALUES ('ddca2d75-dc26-43ef-84ad-0d1d504f4bad', 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'CERDO VA!', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date, user_id) VALUES (2025, 10, 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'ddca2d75-dc26-43ef-84ad-0d1d504f4bad', 'CERDO VA!', 'IN', 1000000, 11, '9427762f-2b79-4b2a-a728-5163040c0054');
INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id, user_id) VALUES ('2025-11-11', 'ac1ee18a-0690-4e52-88ba-159167ad3b55', 'ddca2d75-dc26-43ef-84ad-0d1d504f4bad', 'CERDO VA!', 1000000, 'IN', '8edfd4b2-3831-4079-841f-b66bb42692c4', '9427762f-2b79-4b2a-a728-5163040c0054');

-- Gastos: Alquiler y Comida
INSERT INTO public.fin_categories (id, name, type, user_id) VALUES ('f7469f7e-2446-4e28-8a62-2161c469490f', 'ALQUILER', 'OUT', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date, user_id) VALUES (2025, 10, 'f7469f7e-2446-4e28-8a62-2161c469490f', NULL, 'ALQUILER', 'OUT', 438160.0, 10, '9427762f-2b79-4b2a-a728-5163040c0054');
INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id, user_id) VALUES ('2025-11-10', 'f7469f7e-2446-4e28-8a62-2161c469490f', NULL, 'ALQUILER', 438160.0, 'OUT', '8edfd4b2-3831-4079-841f-b66bb42692c4', '9427762f-2b79-4b2a-a728-5163040c0054');

INSERT INTO public.fin_categories (id, name, type, user_id) VALUES ('0e8734f6-7de9-4d98-bfc4-b0ac87ad4548', 'COMIDA', 'OUT', '9427762f-2b79-4b2a-a728-5163040c0054') ON CONFLICT DO NOTHING;
INSERT INTO public.fin_budget_items (year, month, category_id, sub_category_id, label, type, planned_amount, planned_date, user_id) VALUES (2025, 10, '0e8734f6-7de9-4d98-bfc4-b0ac87ad4548', NULL, 'COMIDA', 'OUT', 300000.0, 15, '9427762f-2b79-4b2a-a728-5163040c0054');
INSERT INTO public.fin_transactions (date, category_id, sub_category_id, description, amount, type, account_id, user_id) VALUES ('2025-11-15', '0e8734f6-7de9-4d98-bfc4-b0ac87ad4548', NULL, 'COMIDA', 789376.4, 'OUT', '8edfd4b2-3831-4079-841f-b66bb42692c4', '9427762f-2b79-4b2a-a728-5163040c0054');

-- Carga finalizada (con estos datos el gráfico ya tendrá barras visibles).
