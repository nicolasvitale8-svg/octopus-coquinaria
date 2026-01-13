export type UnidadMedida = 'Kg' | 'Lt' | 'Un' | 'Paquete' | 'Bolsa' | 'Bidón' | 'Caja';

export type CategoriaInsumo = 'Carnes' | 'Verduras' | 'Lácteos' | 'Panificados' | 'Almacén' | 'Limpieza' | 'Descartables' | 'Bebidas' | 'Varios';

export interface Insumo {
    id: string;
    nombre: string;
    unidad_medida: UnidadMedida;
    categoria: CategoriaInsumo;
    precio_ultimo: number;
    stock_min: number;
    stock_max: number;
    stock_actual: number;
    pack_proveedor: number;
    lead_time_dias: number;
    proveedor_principal?: string;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export type EstadoPresupuesto = 'ABIERTO' | 'CERRADO';

export interface Presupuesto {
    id: string;
    fecha_inicio: string; // ISO Date YYYY-MM-DD
    fecha_fin: string; // ISO Date YYYY-MM-DD
    monto_limite: number;
    monto_gastado: number;
    estado: EstadoPresupuesto;
    observaciones?: string;
    created_by?: string;
}

export type EstadoPedido = 'BORRADOR' | 'ENVIADO' | 'CONFIRMADO' | 'RECIBIDO' | 'CANCELADO';

export interface Pedido {
    id: string;
    presupuesto_id?: string;
    fecha: string;
    proveedor: string;
    estado: EstadoPedido;
    total_estimado: number;
    unidad_negocio_id?: string;
    nota?: string;
    created_at?: string;
    items?: DetallePedido[]; // Optional for list view
}

export interface DetallePedido {
    id: string;
    pedido_id: string;
    insumo_id: string;
    insumo?: Insumo; // Join

    // Snapshots for historical data
    consumo_promedio_diario: number;
    stock_actual_snapshot: number;
    pendiente_recibir_snapshot: number;

    cantidad_sugerida: number;
    cantidad_real: number;
    unidad: string;

    precio_unitario: number;
    subtotal: number;
}

export interface MovimientoStock {
    id: string;
    fecha: string;
    insumo_id: string;
    tipo: 'ENTRADA' | 'SALIDA';
    origen: 'COMPRA' | 'VENTA' | 'RECETA' | 'AJUSTE' | 'MERMA' | 'INICIAL';
    cantidad: number;
    referencia_id?: string;
    usuario_id?: string;
}
