import { supabase } from '../../services/supabase';

// ========== TYPES ==========

export type LoanDirection = 'TAKEN' | 'GIVEN' | 'CREDIT_CARD';
export type LoanStatus = 'ACTIVO' | 'CANCELADO' | 'COMPLETADO';
export type PaymentStatus = 'PENDIENTE' | 'PAGADA';

export interface Loan {
    id: string;
    project_id?: string;
    user_id?: string;
    direction: LoanDirection;
    counterparty: string;
    total_amount: number;
    total_installments: number;
    installment_amount: number;
    interest_rate: number;
    start_date: string; // YYYY-MM-DD
    status: LoanStatus;
    description?: string;
    account_id?: string;
    category_id?: string;
    subcategory_id?: string;
    created_at?: string;
}

export interface LoanPayment {
    id: string;
    loan_id: string;
    installment_number: number;
    due_date: string; // YYYY-MM-DD
    amount: number;
    status: PaymentStatus;
    paid_date?: string;
    created_at?: string;
}

export type CreateLoanDTO = Omit<Loan, 'id' | 'created_at' | 'project_id' | 'user_id'>;

// ========== HELPERS ==========

async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
}

/**
 * Genera el cronograma de cuotas para un préstamo.
 * Si interestRate > 0, calcula cuota fija (sistema francés).
 * Si interestRate === 0, divide monto total / cantidad de cuotas.
 * Si paymentDay se especifica, las cuotas vencen en ese día del mes.
 */
export function generateInstallments(
    totalAmount: number,
    totalInstallments: number,
    interestRate: number,
    startDate: string,
    paymentDay?: number
): Omit<LoanPayment, 'id' | 'loan_id' | 'created_at'>[] {
    const installments: Omit<LoanPayment, 'id' | 'loan_id' | 'created_at'>[] = [];
    const start = new Date(startDate + 'T12:00:00');

    let cuotaAmount: number;

    if (interestRate > 0) {
        // Sistema francés: cuota fija con interés
        const monthlyRate = interestRate / 100 / 12;
        cuotaAmount = totalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalInstallments)) /
            (Math.pow(1 + monthlyRate, totalInstallments) - 1);
    } else {
        cuotaAmount = totalAmount / totalInstallments;
    }

    cuotaAmount = Math.round(cuotaAmount * 100) / 100;

    for (let i = 1; i <= totalInstallments; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(dueDate.getMonth() + i);
        // Si se especifica día de vencimiento, usar ese día
        if (paymentDay && paymentDay >= 1 && paymentDay <= 28) {
            dueDate.setDate(paymentDay);
        }
        const dueDateStr = dueDate.toISOString().split('T')[0];

        installments.push({
            installment_number: i,
            due_date: dueDateStr,
            amount: cuotaAmount,
            status: 'PENDIENTE' as PaymentStatus,
        });
    }

    return installments;
}

// ========== SERVICE ==========

export const loanService = {

    /**
     * Get all loans. If businessId is provided, filter by project_id.
     * If businessId is null/undefined, filter by user_id (personal).
     */
    async getAll(businessId?: string | null): Promise<Loan[]> {
        const query = supabase.from('finance_loans').select('*');

        if (businessId) {
            query.eq('project_id', businessId);
        } else {
            const userId = await getUserId();
            if (!userId) return [];
            query.is('project_id', null).eq('user_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data as Loan[];
    },


    async create(businessId: string | null | undefined, loan: CreateLoanDTO, paidInstallments: number = 0, paymentDay?: number): Promise<Loan> {
        const userId = await getUserId();

        const insertObj = {
            ...loan,
            project_id: businessId || null,
            user_id: userId,
        };

        const { data, error } = await supabase
            .from('finance_loans')
            .insert([insertObj])
            .select()
            .single();

        if (error) throw error;
        const created = data as Loan;

        // Auto-generar cuotas
        const installments = generateInstallments(
            loan.total_amount,
            loan.total_installments,
            loan.interest_rate,
            loan.start_date,
            paymentDay
        );

        const today = new Date().toISOString().split('T')[0];
        const paymentsToInsert = installments.map((inst, idx) => ({
            ...inst,
            loan_id: created.id,
            // Marcar las primeras N cuotas como pagadas
            ...(idx < paidInstallments ? { status: 'PAGADA', paid_date: today } : {}),
        }));

        const { error: payError } = await supabase
            .from('finance_loan_payments')
            .insert(paymentsToInsert);

        if (payError) throw payError;

        return created;
    },

    async update(id: string, updates: Partial<CreateLoanDTO>, paymentDay?: number): Promise<Loan> {
        const { data, error } = await supabase
            .from('finance_loans')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        const updated = data as Loan;

        // Regenerar cuotas si cambiaron valores clave
        if (updates.total_amount !== undefined || updates.total_installments !== undefined ||
            updates.interest_rate !== undefined || updates.start_date !== undefined) {

            // Borrar cuotas viejas
            const { error: delError } = await supabase
                .from('finance_loan_payments')
                .delete()
                .eq('loan_id', id);
            if (delError) throw delError;

            // Generar nuevas cuotas
            const installments = generateInstallments(
                updated.total_amount,
                updated.total_installments,
                updated.interest_rate,
                updated.start_date,
                paymentDay
            );

            const paymentsToInsert = installments.map(inst => ({
                ...inst,
                loan_id: id,
            }));

            const { error: payError } = await supabase
                .from('finance_loan_payments')
                .insert(paymentsToInsert);
            if (payError) throw payError;
        }

        return updated;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('finance_loans')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getPayments(loanId: string): Promise<LoanPayment[]> {
        const { data, error } = await supabase
            .from('finance_loan_payments')
            .select('*')
            .eq('loan_id', loanId)
            .order('installment_number', { ascending: true });

        if (error) throw error;
        return data as LoanPayment[];
    },

    async getAllPayments(loanIds: string[]): Promise<LoanPayment[]> {
        if (loanIds.length === 0) return [];

        const { data, error } = await supabase
            .from('finance_loan_payments')
            .select('*')
            .in('loan_id', loanIds)
            .order('installment_number', { ascending: true });

        if (error) throw error;
        return data as LoanPayment[];
    },

    async recordPayment(paymentId: string, paidDate: string): Promise<void> {
        const { error } = await supabase
            .from('finance_loan_payments')
            .update({ status: 'PAGADA', paid_date: paidDate })
            .eq('id', paymentId);

        if (error) throw error;
    },

    async undoPayment(paymentId: string): Promise<void> {
        const { error } = await supabase
            .from('finance_loan_payments')
            .update({ status: 'PENDIENTE', paid_date: null })
            .eq('id', paymentId);

        if (error) throw error;
    },

    async updateStatus(id: string, status: LoanStatus): Promise<void> {
        const { error } = await supabase
            .from('finance_loans')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    },
};
