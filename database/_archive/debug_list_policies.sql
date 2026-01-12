-- DIAGNÓSTICO CORREGIDO: LISTAR POLÍTICAS ACTIVAS
-- Ejecuta esto para ver qué reglas invisibles siguen vivas en la tabla usuarios.

SELECT polname AS policy_name, polcmd AS command
FROM pg_policy
JOIN pg_class ON pg_policy.polrelid = pg_class.oid
WHERE pg_class.relname = 'usuarios';
