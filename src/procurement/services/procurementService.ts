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
    }
};
