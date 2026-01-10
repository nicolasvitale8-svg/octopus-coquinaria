-- 🔥 SEED_FINANZA_BASE.sql 🔥
-- Objetivo: Proveer tipos de cuenta base y asegurar que la administración de rubros sea funcional.

-- 1. Sembrar Tipos de Cuenta (Account Types)
-- Solo los insertamos si no existen.
INSERT INTO public.fin_account_types (name, description, include_in_cashflow, is_active)
VALUES 
('Banco', 'Cuentas corrientes o cajas de ahorro bancarias', true, true),
('Efectivo', 'Efectivo en mano o caja fuerte', true, true),
('Billetera Virtual', 'Mercado Pago, Brubank, Lemon, etc.', true, true),
('Inversión', 'Plazos fijos, FCI, Cripto', false, true),
('Tarjeta de Crédito', 'Pasivo circulante', true, true)
ON CONFLICT DO NOTHING;

-- 2. Asegurar que los tipos de cuenta sean visibles para todos
GRANT SELECT ON public.fin_account_types TO authenticated;
GRANT SELECT ON public.fin_account_types TO anon;

-- 3. Crear algunos Rubros base si no hay ninguno (Opcional pero recomendado)
INSERT INTO public.fin_categories (name, type, is_active)
SELECT 'Ventas', 'IN', true WHERE NOT EXISTS (SELECT 1 FROM public.fin_categories WHERE type = 'IN' LIMIT 1);

INSERT INTO public.fin_categories (name, type, is_active)
SELECT 'Mercadería', 'OUT', true WHERE NOT EXISTS (SELECT 1 FROM public.fin_categories WHERE type = 'OUT' LIMIT 1);

INSERT INTO public.fin_categories (name, type, is_active)
SELECT 'Servicios', 'OUT', true WHERE NOT EXISTS (SELECT 1 FROM public.fin_categories WHERE name = 'Servicios' LIMIT 1);

INSERT INTO public.fin_categories (name, type, is_active)
SELECT 'Transferencias', 'MIX', true WHERE NOT EXISTS (SELECT 1 FROM public.fin_categories WHERE name = 'Transferencias' LIMIT 1);

SELECT '✅ Tipos de cuenta sembrados y rubros base verificados.' as status;
