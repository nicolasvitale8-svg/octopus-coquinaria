-- VERIFICACIÓN DE ESTADO REAL
-- Corre este script para ver qué está pasando realmente en la base de datos.
-- Si todo está bien, deberías ver:
-- 1. Tu usuario en la lista con rol 'admin'.
-- 2. El conteo de proyectos > 0.

DO $$
DECLARE
    v_user_count int;
    v_role text;
    v_project_count int;
    v_lead_count int;
    v_my_email text := 'nicolasvitale8@gmail.com';
BEGIN
    -- 1. Check User Existence & Role
    SELECT count(*), max(role)
    INTO v_user_count, v_role
    FROM public.usuarios
    WHERE email = v_my_email;

    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'DIAGNÓSTICO PARA: %', v_my_email;
    RAISE NOTICE '---------------------------------------------------';

    IF v_user_count = 0 THEN
        RAISE WARNING 'ERROR CRÍTICO: El usuario NO EXISTE en la tabla public.usuarios.';
        RAISE WARNING '-> Solución: Corre el script "fix_admin_full.sql"';
    ELSE
        RAISE NOTICE 'Usuario encontrado: SÍ';
        RAISE NOTICE 'Rol Actual: %', v_role;
        
        IF v_role != 'admin' THEN
            RAISE WARNING 'ALERTA: El rol no es admin. Es %', v_role;
        ELSE
            RAISE NOTICE 'Estado del Rol: CORRECTO (Admin)';
        END IF;
    END IF;

    -- 2. Check Visibility (RLS Test)
    -- We use a direct select which mimics what the API sees
    SELECT count(*) INTO v_project_count FROM public.projects;
    SELECT count(*) INTO v_lead_count FROM public.diagnosticos_express;
    
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'VISIBILIDAD DE DATOS (Lo que ve el sistema)';
    RAISE NOTICE '---------------------------------------------------';
    RAISE NOTICE 'Proyectos visibles: %', v_project_count;
    RAISE NOTICE 'Leads visibles:     %', v_lead_count;

    IF v_project_count = 0 AND v_lead_count = 0 THEN
        RAISE WARNING 'ALERTA: No ves ningún dato. RLS sigue bloqueando o la base está vacía.';
        RAISE WARNING '-> Solución: Corre "fix_emergency_access.sql"';
    ELSE
        RAISE NOTICE 'Estado de Datos: OPERATIVO (Ves % proyectos y % leads)', v_project_count, v_lead_count;
    END IF;

    RAISE NOTICE '---------------------------------------------------';
END $$;
