import { createClient } from '@supabase/supabase-js';

// NOTA: Usar las mismas variables de entorno que el servicio principal
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupplyItem {
    id: string;
    name: string;
    unit: string;
    last_price: number;
    category: string;
    supplier_name?: string;
}

export interface ProcurementBudget {
    id: string;
    period_start: string;
    period_end: string;
    sales_projected: number;
    cost_target_pct: number;
    limit_amount: number; // Generated
    status: 'OPEN' | 'LOCKED' | 'CLOSED';
}

export interface PurchaseOrder {
    id: string;
    budget_id?: string;
    order_date: string;
    supplier_name: string;
    status: 'DRAFT' | 'VALIDATED' | 'APPROVED' | 'REJECTED';
    total_amount: number;
    gatekeeper_status: 'PENDING' | 'GREEN' | 'RED';
    items?: PurchaseOrderItem[];
    is_forced?: boolean;
    force_reason?: string;
}

export interface PurchaseOrderItem {
    id?: string;
    item_id: string;
    quantity: number;
    unit_price: number;
    subtotal?: number; // Generated or calculated
    item_name?: string; // Join helper
}

export const ProcurementService = {
    // --- ITEMS ---
    async getItems(): Promise<SupplyItem[]> {
        const { data, error } = await supabase
            .from('supply_items')
            .select('*')
            .order('name');
        if (error) throw error;
        return data || [];
    },

    async saveItem(item: Partial<SupplyItem>): Promise<SupplyItem> {
        const { data, error } = await supabase
            .from('supply_items')
            .upsert(item)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async bulkImportItems(items: Partial<SupplyItem>[]): Promise<void> {
        const { error } = await supabase
            .from('supply_items')
            .insert(items);
        if (error) throw error;
    },

    // --- BUDGETS ---
    async getActiveBudget(): Promise<ProcurementBudget | null> {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('procurement_budgets')
            .select('*')
            .lte('period_start', today)
            .gte('period_end', today)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignorar "no rows found"
        return data;
    },

    async createBudget(budget: Partial<ProcurementBudget>): Promise<ProcurementBudget> {
        const { data, error } = await supabase
            .from('procurement_budgets')
            .insert(budget)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // --- ORDERS ---
    async createOrder(order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]): Promise<PurchaseOrder> {
        // 1. Crear Cabecera
        const { data: orderData, error: orderError } = await supabase
            .from('purchase_orders')
            .insert(order)
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Crear Items
        const itemsWithOrderId = items.map(item => ({
            order_id: orderData.id,
            item_id: item.item_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsWithOrderId);

        if (itemsError) {
            // Rollback (borrar orden si fallan los items - idealmente usar RPC transaction)
            await supabase.from('purchase_orders').delete().eq('id', orderData.id);
            throw itemsError;
        }

        return orderData;
    }
};
