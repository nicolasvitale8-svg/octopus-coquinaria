-- ==============================================================================
-- 🚀 CARGA DE PRESUPUESTO ENERO 2026 (CONTEXTO PERSONAL)
-- Este script carga la planificación directamente en "Mis Finanzas".
-- ==============================================================================

DO $action$
DECLARE
    v_user_id UUID;
    
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
    -- 1. OBTENER ID REAL DE NICOLÁS
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'nicolasvitale8@gmail.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró el usuario nicolasvitale8@gmail.com';
    END IF;

    -- 2. ASEGURAR CATEGORÍAS (RUBROS) EN CONTEXTO PERSONAL (business_id IS NULL)
    -- INGRESOS
    SELECT id INTO v_cat_ingresos FROM public.fin_categories WHERE name = 'INGRESOS' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_ingresos IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('INGRESOS', 'IN', v_user_id, NULL) RETURNING id INTO v_cat_ingresos;
    END IF;

    -- SUSCRIPCIONES
    SELECT id INTO v_cat_suscripciones FROM public.fin_categories WHERE name = 'SUSCRIPCIONES' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_suscripciones IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('SUSCRIPCIONES', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_suscripciones;
    END IF;

    -- TELÉFONO
    SELECT id INTO v_cat_telefono FROM public.fin_categories WHERE name = 'TELÉFONO' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_telefono IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('TELÉFONO', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_telefono;
    END IF;

    -- SERVICIOS
    SELECT id INTO v_cat_servicios FROM public.fin_categories WHERE name = 'SERVICIOS' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_servicios IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('SERVICIOS', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_servicios;
    END IF;

    -- EDUCACIÓN
    SELECT id INTO v_cat_educacion FROM public.fin_categories WHERE name = 'EDUCACIÓN' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_educacion IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('EDUCACIÓN', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_educacion;
    END IF;

    -- ALQUILER
    SELECT id INTO v_cat_alquiler FROM public.fin_categories WHERE name = 'ALQUILER' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_alquiler IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('ALQUILER', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_alquiler;
    END IF;

    -- COMIDA
    SELECT id INTO v_cat_comida FROM public.fin_categories WHERE name = 'COMIDA' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_comida IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('COMIDA', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_comida;
    END IF;

    -- ALIMENTOS
    SELECT id INTO v_cat_alimentos FROM public.fin_categories WHERE name = 'ALIMENTOS' AND business_id IS NULL AND user_id = v_user_id;
    IF v_cat_alimentos IS NULL THEN
        INSERT INTO public.fin_categories (name, type, user_id, business_id) VALUES ('ALIMENTOS', 'OUT', v_user_id, NULL) RETURNING id INTO v_cat_alimentos;
    END IF;

    -- 3. LIMPIAR PRESUPUESTO DE ENERO 2026 PERSONAL PREVIO
    DELETE FROM public.fin_budget_items WHERE year = 2026 AND month = 0 AND business_id IS NULL AND user_id = v_user_id;

    -- 4. CARGAR PRESUPUESTO ENERO 2026 PERSONAL (INGRESOS)
    INSERT INTO public.fin_budget_items (year, month, category_id, label, type, planned_amount, planned_date, user_id, business_id) VALUES
    (2026, 0, v_cat_ingresos, 'SUELDO FLY KITCHEN', 'IN', 2200000, 5, v_user_id, NULL),
    (2026, 0, v_cat_ingresos, 'CERDO VA!', 'IN', 1000000, 20, v_user_id, NULL),
    (2026, 0, v_cat_ingresos, 'VIC', 'IN', 150000, 10, v_user_id, NULL);

    -- 5. CARGAR PRESUPUESTO ENERO 2026 PERSONAL (GASTOS)
    INSERT INTO public.fin_budget_items (year, month, category_id, label, type, planned_amount, planned_date, user_id, business_id) VALUES
    (2026, 0, v_cat_suscripciones, 'CHAT GPT', 'OUT', 38613.97, 3, v_user_id, NULL),
    (2026, 0, v_cat_telefono, 'NICO', 'OUT', 11000, 6, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'GAS', 'OUT', 58557, 7, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, '"365"', 'OUT', 6094.86, 7, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, 'AMAZON PRIME', 'OUT', 7836.79, 8, v_user_id, NULL),
    (2026, 0, v_cat_educacion, 'FUSAS', 'OUT', 50000, 10, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'AGUA', 'OUT', 30800, 10, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'RENTAS', 'OUT', 18300, 10, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'MUNICIPAL', 'OUT', 6000, 10, v_user_id, NULL),
    (2026, 0, v_cat_alquiler, 'ALQUILER', 'OUT', 438160, 10, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, 'CUOTA CELU', 'OUT', 164971.32, 10, v_user_id, NULL),
    (2026, 0, v_cat_comida, 'COMIDA', 'OUT', 300000, 15, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, 'HBO MAX', 'OUT', 6174.60, 16, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, 'NIVEL 6', 'OUT', 8990, 17, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'LUZ', 'OUT', 65948, 20, v_user_id, NULL),
    (2026, 0, v_cat_alimentos, 'CARO', 'OUT', 150000, 20, v_user_id, NULL),
    (2026, 0, v_cat_servicios, 'INTERNET', 'OUT', 25000, 21, v_user_id, NULL),
    (2026, 0, v_cat_suscripciones, 'SEGURO DE VIDA', 'OUT', 15568.43, 23, v_user_id, NULL);

    RAISE NOTICE '✅ Presupuesto Personal de Enero 2026 cargado correctamente.';

    -- 6. OPCIONAL: CARGAR TAMBIÉN EN EL PROYECTO "OCTOPUS" SI EXISTE
    DECLARE
        v_project_id UUID;
    BEGIN
        SELECT id INTO v_project_id FROM public.projects WHERE business_name ILIKE '%Octopus%' LIMIT 1;
        
        IF v_project_id IS NOT NULL THEN
            -- Limpiar y cargar en el proyecto
            DELETE FROM public.fin_budget_items WHERE year = 2026 AND month = 0 AND business_id = v_project_id;
            
            -- Re-usar categorías del proyecto o crearlas
            -- (Nota: Para simplicidad en este script masivo, usamos las mismas labels)
            -- El sistema de la App se encargará de mapear categorías por nombre si es necesario.
            
            INSERT INTO public.fin_budget_items (year, month, category_id, label, type, planned_amount, planned_date, user_id, business_id)
            SELECT 2026, 0, category_id, label, type, planned_amount, planned_date, user_id, v_project_id
            FROM public.fin_budget_items 
            WHERE year = 2026 AND month = 0 AND business_id IS NULL AND user_id = v_user_id;
            
            RAISE NOTICE '✅ Copiado también al contexto de proyecto OCTOPUS.';
        END IF;
    END;
END $action$;
