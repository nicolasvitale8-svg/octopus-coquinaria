
-- ==============================================================================
-- 🧹 LIMPIEZA 2025 Y CARGA PRESUPUESTO ENERO 2026
-- Este script borra transacciones viejas y carga la nueva planificación.
-- ==============================================================================

DO $action$
DECLARE
    v_user_id UUID := 'dc1e06af-002f-46ec-900c-c6bef40af35e';
    v_business_id UUID;
    
    -- Categorías
    v_cat_ingresos UUID;
    v_cat_suscripciones UUID;
    v_cat_telefono UUID;
    v_cat_servicios UUID;
    v_cat_educacion UUID;
    v_cat_alquiler UUID;
    v_cat_comida UUID;
    v_cat_alimentos UUID;
BEGIN
    -- 1. OBTENER CONTEXTO OCTOPUS
    SELECT id INTO v_business_id FROM public.businesses WHERE name = 'Octopus' LIMIT 1;

    -- 2. BORRAR TRANSACCIONES OCTUBRE Y NOVIEMBRE 2025
    DELETE FROM public.fin_transactions 
    WHERE user_id = v_user_id 
    AND (
        (date >= '2025-10-01' AND date <= '2025-10-31')
        OR
        (date >= '2025-11-01' AND date <= '2025-11-30')
    );
    RAISE NOTICE 'Transacciones de Octubre y Noviembre borradas.';

    -- 3. ASEGURAR CATEGORÍAS (RUBROS) DESDE EXCEL
    -- INGRESOS
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('INGRESOS', 'IN', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_ingresos FROM public.fin_categories WHERE name = 'INGRESOS' AND business_id = v_business_id;

    -- SUSCRIPCIONES
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('SUSCRIPCIONES', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_suscripciones FROM public.fin_categories WHERE name = 'SUSCRIPCIONES' AND business_id = v_business_id;

    -- TELÉFONO
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('TELÉFONO', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_telefono FROM public.fin_categories WHERE name = 'TELÉFONO' AND business_id = v_business_id;

    -- SERVICIOS
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('SERVICIOS', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_servicios FROM public.fin_categories WHERE name = 'SERVICIOS' AND business_id = v_business_id;

    -- EDUCACIÓN
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('EDUCACIÓN', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_educacion FROM public.fin_categories WHERE name = 'EDUCACIÓN' AND business_id = v_business_id;

    -- ALQUILER
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('ALQUILER', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_alquiler FROM public.fin_categories WHERE name = 'ALQUILER' AND business_id = v_business_id;

    -- COMIDA
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('COMIDA', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_comida FROM public.fin_categories WHERE name = 'COMIDA' AND business_id = v_business_id;

    -- ALIMENTOS
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('ALIMENTOS', 'OUT', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_alimentos FROM public.fin_categories WHERE name = 'ALIMENTOS' AND business_id = v_business_id;

    -- 4. LIMPIAR PRESUPUESTO DE ENERO 2026 PREVIO (Para evitar duplicados)
    DELETE FROM public.fin_budget_items WHERE year = 2026 AND month = 0 AND business_id = v_business_id;

    -- 5. CARGAR PRESUPUESTO ENERO 2026 (INGRESOS)
    INSERT INTO public.fin_budget_items (year, month, category_id, label, type, planned_amount, planned_date, user_id, business_id) VALUES
    (2026, 0, v_cat_ingresos, 'SUELDO FLY KITCHEN', 'IN', 2200000, 5, v_user_id, v_business_id),
    (2026, 0, v_cat_ingresos, 'CERDO VA!', 'IN', 1000000, 20, v_user_id, v_business_id),
    (2026, 0, v_cat_ingresos, 'VIC', 'IN', 150000, 10, v_user_id, v_business_id);

    -- 6. CARGAR PRESUPUESTO ENERO 2026 (GASTOS)
    INSERT INTO public.fin_budget_items (year, month, category_id, label, type, planned_amount, planned_date, user_id, business_id) VALUES
    (2026, 0, v_cat_suscripciones, 'CHAT GPT', 'OUT', 38613.97, 3, v_user_id, v_business_id),
    (2026, 0, v_cat_telefono, 'NICO', 'OUT', 11000, 6, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'GAS', 'OUT', 58557, 7, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, '"365"', 'OUT', 6094.86, 7, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, 'AMAZON PRIME', 'OUT', 7836.79, 8, v_user_id, v_business_id),
    (2026, 0, v_cat_educacion, 'FUSAS', 'OUT', 50000, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'AGUA', 'OUT', 30800, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'RENTAS', 'OUT', 18300, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'MUNICIPAL', 'OUT', 6000, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_alquiler, 'ALQUILER', 'OUT', 438160, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, 'CUOTA CELU', 'OUT', 164971.32, 10, v_user_id, v_business_id),
    (2026, 0, v_cat_comida, 'COMIDA', 'OUT', 300000, 15, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, 'HBO MAX', 'OUT', 6174.60, 16, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, 'NIVEL 6', 'OUT', 8990, 17, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'LUZ', 'OUT', 65948, 20, v_user_id, v_business_id),
    (2026, 0, v_cat_alimentos, 'CARO', 'OUT', 150000, 20, v_user_id, v_business_id),
    (2026, 0, v_cat_servicios, 'INTERNET', 'OUT', 25000, 21, v_user_id, v_business_id),
    (2026, 0, v_cat_suscripciones, 'SEGURO DE VIDA', 'OUT', 15568.43, 23, v_user_id, v_business_id);

    RAISE NOTICE '✅ Limpieza completada y Presupuesto de Enero 2026 cargado.';
END $action$;
