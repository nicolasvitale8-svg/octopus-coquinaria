
-- ==============================================================================
-- 🐙 CONFIGURACIÓN DE CONTEXTO EMPRESARIAL (OCTOPUS)
-- Este script crea la entidad Octopus y separa sus datos de los personales.
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID := 'dc1e06af-002f-46ec-900c-c6bef40af35e';
    v_business_id UUID;
BEGIN
    -- 1. Crear el negocio 'Octopus' si no existe
    -- Nota: La tabla public.businesses NO tiene owner_id, solo name.
    INSERT INTO public.businesses (name)
    VALUES ('Octopus')
    ON CONFLICT (id) DO NOTHING; -- No podemos usar ON CONFLICT (name) si no hay un índice único

    -- Si ya existe por nombre, no insertamos duplicados (check manual)
    IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE name = 'Octopus') THEN
        INSERT INTO public.businesses (name) VALUES ('Octopus');
    END IF;

    -- Obtener el ID del negocio Octopus
    SELECT id INTO v_business_id FROM public.businesses WHERE name = 'Octopus' LIMIT 1;

    -- 2. Vincular a Nicolás como dueño si no está vinculado
    -- Nota: La columna se llama member_role, no role.
    INSERT INTO public.business_memberships (business_id, user_id, member_role)
    VALUES (v_business_id, v_user_id, 'owner')
    ON CONFLICT (business_id, user_id) DO UPDATE SET member_role = 'owner';

    -- 3. Mover Cuentas Empresariales
    -- Todo lo que tenga 'Octopus' en el nombre se considera empresa
    UPDATE public.fin_accounts 
    SET business_id = v_business_id 
    WHERE (name ILIKE '%Octopus%' OR name ILIKE '%Empresa%') AND user_id = v_user_id;

    -- 4. Mover Categorías Empresariales
    UPDATE public.fin_categories 
    SET business_id = v_business_id
    WHERE name IN ('Sueldos y Colaboradores', 'Gastos Operativos', 'Herramientas y Apps', 'Marketing', 'Ventas Octopus')
    AND user_id = v_user_id;

    -- 5. Mover Transacciones asociadas
    -- Movemos transacciones que pertenezcan a las cuentas de empresa o categorías de empresa
    UPDATE public.fin_transactions
    SET business_id = v_business_id
    WHERE (
        account_id IN (SELECT id FROM public.fin_accounts WHERE business_id = v_business_id)
        OR 
        category_id IN (SELECT id FROM public.fin_categories WHERE business_id = v_business_id)
    )
    AND user_id = v_user_id;

    RAISE NOTICE '✅ Contexto Octopus configurado con ID: %', v_business_id;
END $$;
