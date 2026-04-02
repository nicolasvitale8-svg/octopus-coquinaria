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
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id || null;
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
        // 1. Obtener datos de la cuota y el préstamo
        const { data: payment, error: pError } = await supabase
            .from('finance_loan_payments')
            .select('*, loan:finance_loans(*)')
            .eq('id', paymentId)
            .single();

        if (pError) throw pError;
        const loan = payment.loan;

        // 2. Marcar cuota como pagada
        const { error } = await supabase
            .from('finance_loan_payments')
            .update({ status: 'PAGADA', paid_date: paidDate })
            .eq('id', paymentId);

        if (error) throw error;

        // 3. Si hay cuenta asociada, crear transacción
        if (loan.account_id) {
            const isRevenue = loan.direction === 'GIVEN';
            const transaction = {
                date: paidDate,
                category_id: loan.category_id,
                sub_category_id: loan.subcategory_id,
                description: `[CUOTA ${payment.installment_number}] ${loan.counterparty}`,
                amount: payment.amount,
                type: isRevenue ? 'IN' : 'OUT',
                account_id: loan.account_id,
                user_id: loan.user_id,
                project_id: loan.project_id
            };

            const { error: tError } = await supabase
                .from('fin_transactions')
                .insert([transaction]);

            if (tError) {
                console.warn('Error al crear transacción automática:', tError);
            }
        }

        // 4. Verificar si es la última cuota para autocompletar el préstamo
        const { data: remaining } = await supabase
            .from('finance_loan_payments')
            .select('id')
            .eq('loan_id', loan.id)
            .eq('status', 'PENDIENTE');

        if (!remaining || remaining.length === 0) {
            await this.updateStatus(loan.id, 'COMPLETADO');
        }
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

    /**
     * Liquida un préstamo de forma anticipada.
     * Toma el monto real pagado, lo asigna a la primera cuota pendiente,
     * elimina las cuotas pendientes restantes y marca el préstamo como COMPLETADO.
     */
    async settleLoan(loanId: string, finalPayment: number, paidDate: string): Promise<void> {
        // ... (existing code)
        const { data: pendingPayments, error: fetchError } = await supabase
            .from('finance_loan_payments')
            .select('*')
            .eq('loan_id', loanId)
            .eq('status', 'PENDIENTE')
            .order('installment_number', { ascending: true });

        if (fetchError) throw fetchError;
        if (!pendingPayments || pendingPayments.length === 0) {
            throw new Error('No hay cuotas pendientes para liquidar.');
        }

        const firstPending = pendingPayments[0];
        const remainingToDelete = pendingPayments.slice(1).map(p => p.id);

        const { error: updatePayError } = await supabase
            .from('finance_loan_payments')
            .update({
                amount: finalPayment,
                status: 'PAGADA',
                paid_date: paidDate
            })
            .eq('id', firstPending.id);

        if (updatePayError) throw updatePayError;

        if (remainingToDelete.length > 0) {
            const { error: deleteError } = await supabase
                .from('finance_loan_payments')
                .delete()
                .in('id', remainingToDelete);
            if (deleteError) throw deleteError;
        }

        const { error: statusError } = await supabase
            .from('finance_loans')
            .update({ status: 'COMPLETADO' })
            .eq('id', loanId);

        if (statusError) throw statusError;

        const { data: loan } = await supabase
            .from('finance_loans')
            .select('*')
            .eq('id', loanId)
            .single();

        if (loan?.account_id) {
            const isRevenue = loan.direction === 'GIVEN';
            const label = isRevenue ? 'COBRO ANTICIPADO' : 'LIQUIDACIÓN ANTICIPADA';
            const transaction = {
                date: paidDate,
                category_id: loan.category_id,
                sub_category_id: loan.subcategory_id,
                description: `[${label}] ${loan.counterparty}`,
                amount: finalPayment,
                type: isRevenue ? 'IN' : 'OUT',
                account_id: loan.account_id,
                user_id: loan.user_id,
                project_id: loan.project_id
            };

            const { error: tError } = await supabase
                .from('fin_transactions')
                .insert([transaction]);

            if (tError) {
                console.warn('Error al crear transacción automática (liquidación):', tError);
            }
        }
    },

    /**
     * Busca préstamos activos de una entidad que matemáticamente ya tienen saldo cero
     * y los marca como COMPLETADO.
     */
    async autoSettleLoans(businessId?: string | null): Promise<number> {
        const loans = await this.getAll(businessId);
        const activeLoans = loans.filter(l => l.status === 'ACTIVO');
        if (activeLoans.length === 0) return 0;

        const loanIds = activeLoans.map(l => l.id);
        const allPayments = await this.getAllPayments(loanIds);

        let settledCount = 0;
        for (const loan of activeLoans) {
            const loanPayments = allPayments.filter(p => p.loan_id === loan.id);
            const paidAmount = loanPayments
                .filter(p => p.status === 'PAGADA')
                .reduce((sum, p) => sum + p.amount, 0);

            const balance = loan.total_amount - paidAmount;

            // Si el saldo es 0 o negativo, y no hay cuotas pendientes, completar.
            // O si simplemente el saldo es <= 0.
            if (balance <= 0.01) {
                await this.updateStatus(loan.id, 'COMPLETADO');
                settledCount++;
            }
        }
        return settledCount;
    },

    /**
     * Busca transacciones que coincidan con cuotas pendientes y las marca como pagadas.
     */
    async reconcilePaymentsWithTransactions(businessId?: string | null): Promise<number> {
        const userId = await getUserId();
        // 1. Obtener préstamos activos
        const loans = await this.getAll(businessId);
        const activeLoans = loans.filter(l => l.status === 'ACTIVO' && (l.direction === 'TAKEN' || l.direction === 'CREDIT_CARD'));
        if (activeLoans.length === 0) return 0;

        // 2. Obtener todas las cuotas pendientes de estos préstamos
        const loanIds = activeLoans.map(l => l.id);
        const allPendingPayments = await this.getAllPayments(loanIds);
        const pendingPayments = allPendingPayments.filter(p => p.status === 'PENDIENTE');
        if (pendingPayments.length === 0) return 0;

        // 3. Obtener transacciones recientes (aprox últimos 60 días)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];

        const { data: txs, error: txError } = await supabase
            .from('fin_transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', sixtyDaysAgoStr)
            .order('date', { ascending: false });

        if (txError || !txs) return 0;

        let reconciledCount = 0;

        // 4. Macheo
        for (const payment of pendingPayments) {
            const loan = activeLoans.find(l => l.id === payment.loan_id);
            if (!loan) continue;

            const targetAmount = Math.abs(payment.amount);
            const counterpartyUpper = loan.counterparty.toUpperCase();

            // Buscar una transacción que coincida en monto y descripción
            const match = txs.find(t => {
                const txAmount = Math.abs(t.amount);
                const descUpper = t.description.toUpperCase();
                
                // Mismo monto (margen de error de 1 peso por redondeos)
                const amountMatches = Math.abs(txAmount - targetAmount) < 1.1;
                
                // La descripción contiene el nombre de la contraparte (ej: "NARANJA X" en "TARJETA NARANJA X (4/8)")
                const nameMatches = descUpper.includes(counterpartyUpper) || counterpartyUpper.includes(descUpper);

                return amountMatches && nameMatches;
            });

            if (match) {
                // Marcar como pagada
                const { error: updError } = await supabase
                    .from('finance_loan_payments')
                    .update({ status: 'PAGADA', paid_date: match.date })
                    .eq('id', payment.id);

                if (!updError) reconciledCount++;
            }
        }

        return reconciledCount;
    },
};
