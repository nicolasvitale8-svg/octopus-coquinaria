-- ==============================================================================
-- 🐙 EL GATEKEEPER - MÓDULO DE COMPRAS Y ABASTECIMIENTO
-- Versión: 1.0 (2026-01-12)
-- Descripción: Sistema de control de compras con compuerta lógica basada en presupuesto.
-- ==============================================================================

-- 1. TABLA ÍTEMS (RECURSOS)
-- Inventario maestro de insumos con precios y parámetros de stock
CREATE TABLE IF NOT EXISTS public.supply_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL, -- Ej: Kg, Lt, Un, Paquete
    last_price NUMERIC(15,2) DEFAULT 0,
    supplier_id TEXT, -- Relación opcional con tabla de proveedores externos si existiera, o texto libre por ahora
    supplier_name TEXT,
    stock_min NUMERIC(15,2) DEFAULT 0,
    stock_safety NUMERIC(15,2) DEFAULT 0,
    category TEXT, -- Ej: Carne, Verdura, Descartable
    is_active BOOLEAN DEFAULT true,
    user_id UUID REFERENCES auth.users(id), -- Usuario creador
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA PRESUPUESTOS (EL TECHO)
-- Define el límite de gasto para un periodo específico
CREATE TABLE IF NOT EXISTS public.procurement_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sales_projected NUMERIC(15,2) NOT NULL, -- Input gerencia
    cost_target_pct NUMERIC(5,2) NOT NULL DEFAULT 35.0, -- Configurable, default 35%
    limit_amount NUMERIC(15,2) GENERATED ALWAYS AS (sales_projected * (cost_target_pct / 100)) STORED, -- Campo Calculado
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'LOCKED', 'CLOSED')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA ÓRDENES DE COMPRA (EL PEDIDO)
-- Cabecera del pedido semanal/diario
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    budget_id UUID REFERENCES public.procurement_budgets(id),
    order_date DATE DEFAULT CURRENT_DATE,
    supplier_name TEXT,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'VALIDATED', 'APPROVED', 'REJECTED')),
    total_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Campos de validación Gatekeeper
    gatekeeper_status TEXT DEFAULT 'PENDING' CHECK (gatekeeper_status IN ('PENDING', 'GREEN', 'RED')),
    deviation_amount NUMERIC(15,2) DEFAULT 0,
    
    -- Override
    is_forced BOOLEAN DEFAULT false,
    forced_by UUID REFERENCES auth.users(id),
    force_reason TEXT,
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ÍTEMS DE LA ORDEN (DETALLE)
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.supply_items(id),
    quantity NUMERIC(15,2) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL, -- Precio snapshot al momento de la orden
    subtotal NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. POLÍTICAS RLS (SEGURIDAD)
ALTER TABLE public.supply_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Política simple: Permitir todo a usuarios autenticados por ahora (Refinar luego con roles)
CREATE POLICY "Accesible para todos los usuarios autenticados" ON public.supply_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accesible para todos los usuarios autenticados" ON public.procurement_budgets
    FOR ALL USING (auth.role() = 'authenticated');
    
CREATE POLICY "Accesible para todos los usuarios autenticados" ON public.purchase_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Accesible para todos los usuarios autenticados" ON public.purchase_order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. DATOS DE EJEMPLO (SEED)
INSERT INTO public.supply_items (name, unit, last_price, category) VALUES
('Bondiola Cerdo', 'Kg', 6500.00, 'Carnes'),
('Pan Burger Brioche', 'Un', 450.00, 'Panificados'),
('Cheddar Feteado', 'Paquete', 8500.00, 'Lácteos'),
('Papas Bastón Cong.', 'Bolsa', 4200.00, 'Congelados'),
('Aceite Girasol 10L', 'Bidón', 18000.00, 'Almacén');

SELECT '✅ ESQUEMA GATEKEEPER CREADO CORRECTAMENTE' as status;
