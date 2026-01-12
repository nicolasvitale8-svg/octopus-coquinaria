-- SQL for syncing FinanzaFlow categories with presupuesto.xlsx
-- Based on audio feedback: Rubros and Sub-rubros for both IN and OUT.

-- 1. CLEAN UP (Optional: Be careful with existing data)
-- For now, we only insert what's missing.

-- 2. INCOME CATEGORIES (INGRESOS)
DO $$
DECLARE
    cat_id_ingresos TEXT;
BEGIN
    -- Check or Insert 'INGRESOS' category
    INSERT INTO public.fin_categories (name, type, is_active)
    VALUES ('INGRESOS', 'IN', true)
    ON CONFLICT (id) DO NOTHING; -- Assuming ID is naturally assigned if not provided, but we don't have natural keys here.
    
    -- Let's use name-based logic for the script
    SELECT id INTO cat_id_ingresos FROM public.fin_categories WHERE name = 'INGRESOS' AND type = 'IN' LIMIT 1;
    
    IF cat_id_ingresos IS NULL THEN
        INSERT INTO public.fin_categories (id, name, type, is_active)
        VALUES (gen_random_uuid()::text, 'INGRESOS', 'IN', true)
        RETURNING id INTO cat_id_ingresos;
    END IF;

    -- Subcategories for INGRESOS
    INSERT INTO public.fin_subcategories (category_id, name, is_active)
    VALUES 
        (cat_id_ingresos, 'SUELDO QALA', true),
        (cat_id_ingresos, 'SUELDO FLY KITCHEN', true),
        (cat_id_ingresos, 'COLIFA CARTA', true),
        (cat_id_ingresos, 'COLIFA FICHAS TECNICAS', true),
        (cat_id_ingresos, 'CERDO VA!', true),
        (cat_id_ingresos, 'INTERESES', true),
        (cat_id_ingresos, 'FRASCOS', true),
        (cat_id_ingresos, 'LIQ QALA 1', true),
        (cat_id_ingresos, 'AGUINALDO FLY', true)
    ON CONFLICT DO NOTHING;
END $$;

-- 3. EXPENSE CATEGORIES (GASTOS)
DO $$
DECLARE
    cat_id TEXT;
BEGIN
    -- SUSCRIPCIONES
    INSERT INTO public.fin_categories (id, name, type, is_active)
    VALUES (gen_random_uuid()::text, 'SUSCRIPCIONES', 'OUT', true)
    RETURNING id INTO cat_id;
    
    INSERT INTO public.fin_subcategories (category_id, name, is_active)
    VALUES 
        (cat_id, 'CHAT GPT', true),
        (cat_id, '365', true),
        (cat_id, 'AMAZON PRIME', true)
    ON CONFLICT DO NOTHING;

    -- TELÉFONO
    INSERT INTO public.fin_categories (id, name, type, is_active)
    VALUES (gen_random_uuid()::text, 'TELÉFONO', 'OUT', true)
    RETURNING id INTO cat_id;
    
    INSERT INTO public.fin_subcategories (category_id, name, is_active)
    VALUES (cat_id, 'NICO', true) ON CONFLICT DO NOTHING;

    -- SERVICIOS
    INSERT INTO public.fin_categories (id, name, type, is_active)
    VALUES (gen_random_uuid()::text, 'SERVICIOS', 'OUT', true)
    RETURNING id INTO cat_id;
    
    INSERT INTO public.fin_subcategories (category_id, name, is_active)
    VALUES (cat_id, 'GAS', true), (cat_id, 'LUZ', true), (cat_id, 'AGUA', true) ON CONFLICT DO NOTHING;

    -- VIÁTICOS
    INSERT INTO public.fin_categories (id, name, type, is_active)
    VALUES (gen_random_uuid()::text, 'VIÁTICOS', 'OUT', true)
    RETURNING id INTO cat_id;
    
    INSERT INTO public.fin_subcategories (category_id, name, is_active)
    VALUES (cat_id, 'NICO', true), (cat_id, 'VICENTE', true) ON CONFLICT DO NOTHING;

    -- COMIDA
    INSERT INTO public.fin_categories (id, name, type, is_active)
    VALUES (gen_random_uuid()::text, 'COMIDA', 'OUT', true);
END $$;
