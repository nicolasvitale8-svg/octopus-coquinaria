
-- ==============================================================================
-- 🧹 LIMPIEZA DE TRANSACCIONES DUPLICADAS
-- Elimina registros exactos que se repiten por error de migración.
-- ==============================================================================

-- 1. Ver cuántos duplicados hay antes de borrar
SELECT 
    description, amount, date, count(*)
FROM 
    public.fin_transactions
GROUP BY 
    description, amount, date, type, account_id, user_id
HAVING 
    count(*) > 1;

-- 2. Borrar manteniendo solo uno de cada conjunto de duplicados
DELETE FROM public.fin_transactions
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
        ROW_NUMBER() OVER (
            PARTITION BY date, description, amount, type, account_id, user_id
            ORDER BY id
        ) as row_num
        FROM public.fin_transactions
    ) t
    WHERE t.row_num > 1
);

-- 3. Verificación final
SELECT '✅ LIMPIEZA COMPLETADA' as status, count(*) as total_transacciones
FROM public.fin_transactions;
