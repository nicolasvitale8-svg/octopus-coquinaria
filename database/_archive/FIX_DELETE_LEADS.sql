-- ==========================================
-- 🛠️ FIX_DELETE_AND_SCORE.sql
-- Arreglo para permitir eliminación de leads y visualización correcta
-- ==========================================

-- 1. Permitir ELIMINACIÓN de Leads (Faltaba esta política)
DROP POLICY IF EXISTS "policy_leads_delete" ON public.diagnosticos_express;
CREATE POLICY "policy_leads_delete" ON public.diagnosticos_express
FOR DELETE TO authenticated
USING (
  (public.get_auth_role() = 'admin')
);

-- 2. Asegurarse de que el Score se guarde como número entero (Opcional, pero recomendado)
-- La corrección principal será en el frontend.

SELECT '✅ POLÍTICA DE ELIMINACIÓN ACTIVADA. Ahora los administradores pueden borrar leads.' as status;
