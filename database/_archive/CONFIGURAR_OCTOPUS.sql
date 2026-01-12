
-- ==============================================================================
-- 🐙 CONFIGURACIÓN DE OCTOPUS (SOLUCIÓN GARANTIZADA)
-- Este script elimina residuos huérfanos y configura el negocio limpiamente.
-- ==============================================================================

-- 1. REPARAR ESTRUCTURA Y LIMPIAR HUÉRFANOS (Fuera de bloques para asegurar éxito)
-- Desactivar la restricción temporalmente
ALTER TABLE public.business_memberships 
DROP CONSTRAINT IF EXISTS business_memberships_business_id_fkey;

-- ELIMINAR CUALQUIER DATO QUE NO TENGA EMPRESA (Esto es lo que causaba el error 23503)
DELETE FROM public.business_memberships 
WHERE business_id NOT IN (SELECT id FROM public.businesses);

-- Volver a crear la restricción apuntando correctamente
ALTER TABLE public.business_memberships 
ADD CONSTRAINT business_memberships_business_id_fkey 
FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- 2. CONFIGURAR DATOS
DO $final_setup$
DECLARE
    v_user_id UUID := 'dc1e06af-002f-46ec-900c-c6bef40af35e';
    v_business_id UUID;
BEGIN
    -- A. Limpiar cualquier registro previo de Octopus para empezar de cero
    DELETE FROM public.business_memberships WHERE business_id IN (SELECT id FROM public.businesses WHERE name = 'Octopus');
    DELETE FROM public.businesses WHERE name = 'Octopus';

    -- B. Crear el negocio 'Octopus'
    INSERT INTO public.businesses (name) 
    VALUES ('Octopus') 
    RETURNING id INTO v_business_id;

    -- C. Vincular a Nicolás (owner)
    INSERT INTO public.business_memberships (business_id, user_id, member_role)
    VALUES (v_business_id, v_user_id, 'owner');

    -- D. Migrar Cuentas, Categorías y Transacciones
    UPDATE public.fin_accounts 
    SET business_id = v_business_id 
    WHERE (name ILIKE '%Octopus%' OR name ILIKE '%Empresa%') 
    AND user_id = v_user_id;

    UPDATE public.fin_categories 
    SET business_id = v_business_id
    WHERE name IN ('Sueldos y Colaboradores', 'Gastos Operativos', 'Herramientas y Apps', 'Marketing', 'Ventas Octopus')
    AND user_id = v_user_id;

    UPDATE public.fin_transactions
    SET business_id = v_business_id
    WHERE (
        account_id IN (SELECT id FROM public.fin_accounts WHERE business_id = v_business_id)
        OR 
        category_id IN (SELECT id FROM public.fin_categories WHERE business_id = v_business_id)
    )
    AND user_id = v_user_id;

    RAISE NOTICE '✅ Octopus configurado con éxito. ID: %', v_business_id;
END $final_setup$;
