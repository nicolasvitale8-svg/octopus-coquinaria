
-- ==============================================================================
-- 📋 POBLADO DE ESTRUCTURA DESDE EXCEL (OCTOPUS)
-- Rubros e Ítems basados en la planilla de Nicolás.
-- ==============================================================================

DO $seed_excel$
DECLARE
    v_business_id UUID;
    v_user_id UUID := 'dc1e06af-002f-46ec-900c-c6bef40af35e';
    
    v_cat_ingresos UUID;
    v_cat_educacion UUID;
    v_cat_comida UUID;
    v_cat_viaticos UUID;
    v_cat_ahorro UUID;
    v_cat_personal UUID;
BEGIN
    -- 1. Obtener ID del negocio Octopus
    SELECT id INTO v_business_id FROM public.businesses WHERE name = 'Octopus' LIMIT 1;
    
    -- 2. Asegurar Rubros (Categorías) para este contexto
    
    -- INGRESOS
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('INGRESOS', 'IN', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_ingresos;
    IF v_cat_ingresos IS NULL THEN SELECT id INTO v_cat_ingresos FROM public.fin_categories WHERE name = 'INGRESOS' AND business_id = v_business_id; END IF;

    -- EDUCACIÓN
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('EDUCACIÓN', 'OUT', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_educacion;
    IF v_cat_educacion IS NULL THEN SELECT id INTO v_cat_educacion FROM public.fin_categories WHERE name = 'EDUCACIÓN' AND business_id = v_business_id; END IF;

    -- COMIDA
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('COMIDA', 'OUT', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_comida;
    IF v_cat_comida IS NULL THEN SELECT id INTO v_cat_comida FROM public.fin_categories WHERE name = 'COMIDA' AND business_id = v_business_id; END IF;

    -- VIÁTICOS
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('VIÁTICOS', 'OUT', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_viaticos;
    IF v_cat_viaticos IS NULL THEN SELECT id INTO v_cat_viaticos FROM public.fin_categories WHERE name = 'VIÁTICOS' AND business_id = v_business_id; END IF;

    -- AHORRO
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('AHORRO', 'OUT', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_ahorro;
    IF v_cat_ahorro IS NULL THEN SELECT id INTO v_cat_ahorro FROM public.fin_categories WHERE name = 'AHORRO' AND business_id = v_business_id; END IF;

    -- PERSONAL
    INSERT INTO public.fin_categories (name, type, user_id, business_id) 
    VALUES ('PERSONAL', 'OUT', v_user_id, v_business_id)
    ON CONFLICT (id) DO NOTHING RETURNING id INTO v_cat_personal;
    IF v_cat_personal IS NULL THEN SELECT id INTO v_cat_personal FROM public.fin_categories WHERE name = 'PERSONAL' AND business_id = v_business_id; END IF;

    -- 3. Insertar Ítems (Subcategorías)
    
    -- Items INGRESOS
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_ingresos, 'Sueldo Qala', v_user_id, v_business_id),
    (v_cat_ingresos, 'Colifa Carta', v_user_id, v_business_id),
    (v_cat_ingresos, 'Cerdo Va!', v_user_id, v_business_id),
    (v_cat_ingresos, 'Frascos', v_user_id, v_business_id),
    (v_cat_ingresos, 'Intereses', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    -- Items EDUCACIÓN
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_educacion, 'Fusas', v_user_id, v_business_id),
    (v_cat_educacion, 'Refuerzo Escolar', v_user_id, v_business_id),
    (v_cat_educacion, 'Fran Viaje', v_user_id, v_business_id),
    (v_cat_educacion, 'Fran Egresado', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    -- Items COMIDA
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_comida, 'Carnicería', v_user_id, v_business_id),
    (v_cat_comida, 'Fiambres', v_user_id, v_business_id),
    (v_cat_comida, 'Supermercado', v_user_id, v_business_id),
    (v_cat_comida, 'Verdulería', v_user_id, v_business_id),
    (v_cat_comida, 'Limpieza', v_user_id, v_business_id),
    (v_cat_comida, 'Ocio', v_user_id, v_business_id),
    (v_cat_comida, 'Propina', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    -- Items VIÁTICOS
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_viaticos, 'Fran', v_user_id, v_business_id),
    (v_cat_viaticos, 'Nico', v_user_id, v_business_id),
    (v_cat_viaticos, 'Vicente', v_user_id, v_business_id),
    (v_cat_viaticos, 'Octopus', v_user_id, v_business_id),
    (v_cat_viaticos, 'Fletes', v_user_id, v_business_id),
    (v_cat_viaticos, 'Reintegro Sube', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    -- Items AHORRO
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_ahorro, 'Frascos', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    -- Items PERSONAL
    INSERT INTO public.fin_subcategories (category_id, name, user_id, business_id) VALUES
    (v_cat_personal, 'Nicolas', v_user_id, v_business_id)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Estructura de Excel cargada correctamente.';
END $seed_excel$;
