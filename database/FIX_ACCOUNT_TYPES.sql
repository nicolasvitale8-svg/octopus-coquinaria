-- 🔧 FIX: Tipos de cuenta no visibles por políticas RLS
-- Ejecutar en Supabase SQL Editor

-- 1. Crear política que permita leer tipos de cuenta globales (sin user_id/business_id)
DROP POLICY IF EXISTS "fin_account_types_global_read" ON public.fin_account_types;
CREATE POLICY "fin_account_types_global_read" ON public.fin_account_types
    FOR SELECT
    USING (
        user_id IS NULL AND business_id IS NULL  -- Tipos globales visibles para todos
        OR public.can_access_fin_data(user_id, business_id)  -- O acceso normal
    );

-- 2. Eliminar la política genérica conflictiva solo para account_types
DROP POLICY IF EXISTS "fin_access_policy" ON public.fin_account_types;

-- 3. Insertar tipos de cuenta base (globales, sin user_id ni business_id)
INSERT INTO public.fin_account_types (id, name, description, include_in_cashflow, is_active, user_id, business_id)
VALUES 
    ('type_banco', 'Banco', 'Cuentas corrientes o cajas de ahorro bancarias', true, true, NULL, NULL),
    ('type_efectivo', 'Efectivo', 'Efectivo en mano o caja fuerte', true, true, NULL, NULL),
    ('type_billetera', 'Billetera Virtual', 'Mercado Pago, Brubank, Lemon, etc.', true, true, NULL, NULL),
    ('type_inversion', 'Inversión', 'Plazos fijos, FCI, Cripto', false, true, NULL, NULL),
    ('type_tarjeta', 'Tarjeta de Crédito', 'Pasivo circulante', true, true, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 4. Verificar que se insertaron correctamente
SELECT id, name, description FROM public.fin_account_types;

-- ✅ Después de ejecutar, recarga la página de la app
