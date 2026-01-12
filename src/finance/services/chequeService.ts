import { supabase } from '../../services/supabase';

export interface Cheque {
    id: string;
    project_id: string;
    cheque_number: string;
    bank_name: string;
    amount: number;
    issue_date: string; // YYYY-MM-DD
    payment_date: string; // YYYY-MM-DD (Vencimiento)
    type: 'PROPIO' | 'TERCERO';
    status: 'PENDIENTE' | 'ENTREGADO' | 'DEPOSITADO' | 'COBRADO' | 'ANULADO' | 'RECHAZADO';
    recipient_sender?: string;
    description?: string;
    created_at?: string;
}

export type CreateChequeDTO = Omit<Cheque, 'id' | 'created_at' | 'project_id'>;

export const chequeService = {

    async getAll(projectId: string) {
        const { data, error } = await supabase
            .from('finance_cheques')
            .select('*')
            .eq('project_id', projectId)
            .order('payment_date', { ascending: true });

        if (error) throw error;
        return data as Cheque[];
    },

    async create(projectId: string, cheque: CreateChequeDTO) {
        const { data, error } = await supabase
            .from('finance_cheques')
            .insert([{ ...cheque, project_id: projectId }])
            .select()
            .single();

        if (error) throw error;
        return data as Cheque;
    },

    async update(id: string, updates: Partial<CreateChequeDTO>) {
        const { data, error } = await supabase
            .from('finance_cheques')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Cheque;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('finance_cheques')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async updateStatus(id: string, status: Cheque['status']) {
        return this.update(id, { status });
    }
};
