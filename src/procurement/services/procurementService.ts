import { supabase } from '../../services/supabase';
import { Insumo, Pedido, DetallePedido, Presupuesto, MovimientoStock } from '../types';

export const procurementService = {
    // --- INSUMOS ---
    async getInsumos(): Promise<Insumo[]> {
        const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .order('nombre');

        if (error) throw error;
        return data || [];
    },

    async getInsumoById(id: string): Promise<Insumo | null> {
        const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async updateInsumo(id: string, updates: Partial<Insumo>) {
        const { error } = await supabase
            .from('insumos')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    async createInsumo(item: Partial<Insumo>) {
        const { error } = await supabase
            .from('insumos')
            .insert(item);
        if (error) throw error;
    },

    // --- PRESUPUESTOS ---
    async getPresupuestoActual(): Promise<Presupuesto | null> {
        const today = new Date().toISOString().split('T')[0];

        // Buscar presupuesto abierto que cubra la fecha actual
        const { data, error } = await supabase
            .from('presupuestos_compras')
            .select('*')
            .eq('estado', 'ABIERTO')
            .lte('fecha_inicio', today)
            .gte('fecha_fin', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignorar not found
        return data;
    },

    // --- PEDIDOS ---
    async getPedidos(estado?: string): Promise<Pedido[]> {
        let query = supabase
            .from('pedidos_compras')
            .select('*')
            .order('created_at', { ascending: false });

        if (estado) {
            query = query.eq('estado', estado);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getPedidoById(id: string): Promise<Pedido | null> {
        const { data, error } = await supabase
            .from('pedidos_compras')
            .select('*')
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async createPedido(pedido: Partial<Pedido>): Promise<Pedido> {
        const { data, error } = await supabase
            .from('pedidos_compras')
            .insert(pedido)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updatePedido(id: string, updates: Partial<Pedido>) {
        const { error } = await supabase
            .from('pedidos_compras')
            .update(updates)
            .eq('id', id);
        if (error) throw error;
    },

    // --- DETALLE PEDIDO ---
    async getDetallesPedido(pedidoId: string): Promise<DetallePedido[]> {
        const { data, error } = await supabase
            .from('pedidos_detalle')
            .select('*, insumo:insumos(*)')
            .eq('pedido_id', pedidoId);

        if (error) throw error;
        return data || [];
    },

    async upsertDetalle(detalle: Partial<DetallePedido>) {
        const { data, error } = await supabase
            .from('pedidos_detalle')
            .upsert(detalle)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteDetalle(id: string) {
        const { error } = await supabase
            .from('pedidos_detalle')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- ACCIONES COMPLEJAS ---

    // Recepción de pedido: Cambia estado y genera movimientos
    async recibirPedido(pedidoId: string) {
        // 1. Obtener detalles
        const detalles = await this.getDetallesPedido(pedidoId);
        if (detalles.length === 0) throw new Error("El pedido no tiene ítems.");

        // 2. Crear movimientos de stock
        const movimientos = detalles.map(d => ({
            insumo_id: d.insumo_id,
            tipo: 'ENTRADA',
            origen: 'COMPRA',
            cantidad: d.cantidad_real,
            referencia_id: pedidoId,
            fecha: new Date().toISOString()
        }));

        const { error: moveError } = await supabase
            .from('movimientos_stock')
            .insert(movimientos);

        if (moveError) throw moveError;

        // 3. Actualizar estado del pedido
        await this.updatePedido(pedidoId, { estado: 'RECIBIDO' });

        // 4. (Opcional) Actualizar stock_actual en la tabla insumos 
        // Idealmente esto se haría con un Trigger en DB, 
        // pero lo hacemos aquí por si no hay triggers.
        for (const d of detalles) {
            // Fetch current stock first to atomic update? 
            // Mejor llamar a una RPC si existiera, o update simple.
            // Hacemos update simple incrementando
            // Nota: esto no es safe para concurrencia alta sin RPC.
            // Asumimos bajo volumen.
            const { data: insumo } = await supabase.from('insumos').select('stock_actual').eq('id', d.insumo_id).single();
            if (insumo) {
                await supabase.from('insumos').update({
                    stock_actual: (insumo.stock_actual || 0) + d.cantidad_real
                }).eq('id', d.insumo_id);
            }
        }
    },

    // --- MOVIMIENTOS DE STOCK ---
    async getMovimientos(filtros?: { insumo_id?: string; tipo?: string; desde?: string; hasta?: string }): Promise<MovimientoStock[]> {
        let query = supabase
            .from('movimientos_stock')
            .select('*')
            .order('fecha', { ascending: false });

        if (filtros?.insumo_id) {
            query = query.eq('insumo_id', filtros.insumo_id);
        }
        if (filtros?.tipo) {
            query = query.eq('tipo', filtros.tipo);
        }
        if (filtros?.desde) {
            query = query.gte('fecha', filtros.desde);
        }
        if (filtros?.hasta) {
            query = query.lte('fecha', filtros.hasta);
        }

        const { data, error } = await query.limit(500);
        if (error) throw error;
        return data || [];
    },

    async createMovimiento(movimiento: Partial<MovimientoStock>) {
        const { data, error } = await supabase
            .from('movimientos_stock')
            .insert({
                ...movimiento,
                fecha: movimiento.fecha || new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        // Actualizar stock del insumo
        if (movimiento.insumo_id && movimiento.cantidad) {
            const { data: insumo } = await supabase
                .from('insumos')
                .select('stock_actual')
                .eq('id', movimiento.insumo_id)
                .single();

            if (insumo) {
                const delta = movimiento.tipo === 'ENTRADA' ? movimiento.cantidad : -movimiento.cantidad;
                await supabase
                    .from('insumos')
                    .update({ stock_actual: Math.max(0, (insumo.stock_actual || 0) + delta) })
                    .eq('id', movimiento.insumo_id);
            }
        }

        return data;
    },

    // --- ALERTAS DE STOCK ---
    async getInsumosConAlerta(): Promise<(Insumo & { alerta: 'CRITICO' | 'ALERTA' | 'OK'; punto_pedido: number })[]> {
        const insumos = await this.getInsumos();

        return insumos
            .filter(i => i.activo !== false)
            .map(insumo => {
                // Punto de pedido = stock_min + (consumo_estimado * lead_time)
                // Por ahora usamos un estimado básico
                const consumoEstimado = 1; // TODO: calcular desde historial
                const puntoPedido = (insumo.stock_min || 0) + (consumoEstimado * (insumo.lead_time_dias || 0));

                let alerta: 'CRITICO' | 'ALERTA' | 'OK' = 'OK';
                if ((insumo.stock_actual || 0) <= (insumo.stock_min || 0)) {
                    alerta = 'CRITICO';
                } else if ((insumo.stock_actual || 0) <= puntoPedido) {
                    alerta = 'ALERTA';
                }

                return {
                    ...insumo,
                    alerta,
                    punto_pedido: puntoPedido
                };
            })
            .sort((a, b) => {
                // Ordenar: CRITICO primero, luego ALERTA, luego OK
                const orden = { CRITICO: 0, ALERTA: 1, OK: 2 };
                return orden[a.alerta] - orden[b.alerta];
            });
    },

    // --- CONSUMO PROMEDIO ---
    async getConsumoPromedio(insumoId: string, diasHistorico: number = 30): Promise<number> {
        const desde = new Date();
        desde.setDate(desde.getDate() - diasHistorico);

        const { data, error } = await supabase
            .from('movimientos_stock')
            .select('cantidad')
            .eq('insumo_id', insumoId)
            .eq('tipo', 'SALIDA')
            .gte('fecha', desde.toISOString());

        if (error) throw error;

        const totalSalidas = (data || []).reduce((sum, m) => sum + (m.cantidad || 0), 0);
        return totalSalidas / diasHistorico;
    }
};
