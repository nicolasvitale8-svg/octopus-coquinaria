-- ==============================================================================
-- 🐙 EL GATEKEEPER - MÓDULO DE COMPRAS (ESPAÑOL)
-- Versión: 2.0 (2026-01-12)
-- Descripción: Sistema de control de compras con validación presupuestaria y kardex.
-- ==============================================================================

-- 1. TABLA INSUMOS (Maestro de Productos)
CREATE TABLE IF NOT EXISTS public.insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    unidad_medida TEXT NOT NULL, -- 'Kg', 'Lt', 'Un', etc.
    categoria TEXT, -- 'Carnes', 'Verduras', 'Almacen', etc.
    precio_ultimo NUMERIC(15,2) DEFAULT 0,
    stock_min NUMERIC(15,2) DEFAULT 0,
    stock_max NUMERIC(15,2) DEFAULT 0,
    stock_actual NUMERIC(15,2) DEFAULT 0, -- Se actualiza vía triggers/movimientos
    pack_proveedor NUMERIC(15,2) DEFAULT 1, -- Cantidad que viene en el bulto cerrado
    lead_time_dias INTEGER DEFAULT 1, -- Días que tarda en llegar
    proveedor_principal TEXT, -- Nombre o referencia
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA PRESUPUESTOS (El Techo)
CREATE TABLE IF NOT EXISTS public.presupuestos_compras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    monto_limite NUMERIC(15,2) NOT NULL,
    monto_gastado NUMERIC(15,2) DEFAULT 0, -- Se puede calcular sumarizando pedidos confirmados/recibidos
    estado TEXT DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
    observaciones TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABLA PEDIDOS (Cabecera)
CREATE TABLE IF NOT EXISTS public.pedidos_compras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    presupuesto_id UUID REFERENCES public.presupuestos_compras(id),
    unidad_negocio_id UUID REFERENCES public.businesses(id), -- Opcional, si aplica
    fecha DATE DEFAULT CURRENT_DATE,
    proveedor TEXT,
    estado TEXT DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ENVIADO', 'CONFIRMADO', 'RECIBIDO', 'CANCELADO')),
    total_estimado NUMERIC(15,2) DEFAULT 0,
    nota TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DETALLE PEDIDO (Renglones)
CREATE TABLE IF NOT EXISTS public.pedidos_detalle (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pedido_id UUID REFERENCES public.pedidos_compras(id) ON DELETE CASCADE,
    insumo_id UUID REFERENCES public.insumos(id),
    
    -- Valores Snapshot para el cálculo de sugerido (histórico)
    consumo_promedio_diario NUMERIC(15,2) DEFAULT 0,
    stock_actual_snapshot NUMERIC(15,2) DEFAULT 0,
    pendiente_recibir_snapshot NUMERIC(15,2) DEFAULT 0,
    
    cantidad_sugerida NUMERIC(15,2) DEFAULT 0,
    cantidad_real NUMERIC(15,2) NOT NULL, -- Lo que el usuario finalmente pide
    unidad TEXT, -- Copia de insumos.unidad_medida
    
    precio_unitario NUMERIC(15,2) DEFAULT 0,
    subtotal NUMERIC(15,2) GENERATED ALWAYS AS (cantidad_real * precio_unitario) STORED,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA MOVIMIENTOS DE STOCK (Kardex)
CREATE TABLE IF NOT EXISTS public.movimientos_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha TIMESTAMPTZ DEFAULT now(),
    insumo_id UUID REFERENCES public.insumos(id),
    tipo TEXT CHECK (tipo IN ('ENTRADA', 'SALIDA')),
    origen TEXT CHECK (origen IN ('COMPRA', 'VENTA', 'RECETA', 'AJUSTE', 'MERMA', 'INICIAL')),
    cantidad NUMERIC(15,2) NOT NULL,
    costo_unitario NUMERIC(15,2), -- Opcional, para valorizar inventario
    referencia_id TEXT, -- ID del pedido, venta, etc.
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. POLÍTICAS RLS (Seguridad Básica)
ALTER TABLE public.insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuestos_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_stock ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar luego según roles)
CREATE POLICY "Acceso total insumos" ON public.insumos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso total presupuestos" ON public.presupuestos_compras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso total pedidos" ON public.pedidos_compras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso total detalles" ON public.pedidos_detalle FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acceso total movimientos" ON public.movimientos_stock FOR ALL USING (auth.role() = 'authenticated');

-- 7. DATOS DE EJEMPLO (SEED) - Solo si está vacía
INSERT INTO public.insumos (nombre, unidad_medida, categoria, precio_ultimo, pack_proveedor, stock_min, stock_max)
SELECT 'Bondiola de Cerdo', 'Kg', 'Carnes', 6500, 10, 20, 100
WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nombre = 'Bondiola de Cerdo');

INSERT INTO public.insumos (nombre, unidad_medida, categoria, precio_ultimo, pack_proveedor, stock_min, stock_max)
SELECT 'Pan Brioche', 'Un', 'Panificados', 450, 6, 50, 200
WHERE NOT EXISTS (SELECT 1 FROM public.insumos WHERE nombre = 'Pan Brioche');

SELECT '✅ ESQUEMA EN ESPAÑOL CREADO CORRECTAMENTE' as status;
