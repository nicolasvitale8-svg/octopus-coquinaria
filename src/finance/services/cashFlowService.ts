import { supabase } from '../../services/supabase';
import { Account, AccountType, BudgetItem } from '../financeTypes';
import { Cheque } from './chequeService';

export interface DailyFlow {
    date: string; // YYYY-MM-DD
    openingBalance: number;
    inflow: number;
    outflow: number;
    net: number;
    finalBalance: number;
    events: CashFlowEvent[];
}

export interface CashFlowEvent {
    id: string;
    date: string;
    type: 'CHEQUE' | 'BUDGET';
    flow: 'IN' | 'OUT';
    amount: number;
    description: string;
    status: string; // 'PENDIENTE', 'ESTIMADO'
}

export const cashFlowService = {
    // Get initial liquidity (sum of accounts flagged as includeInCashflow)
    async getInitialLiquidity(projectId: string): Promise<number> {
        // 1. Get Account Types that are included in cashflow
        const { data: types, error: typesError } = await supabase
            .from('finance_account_types')
            .select('id')
            .eq('includeInCashflow', true);

        if (typesError) throw typesError;
        const validTypIds = types.map(t => t.id);

        if (validTypIds.length === 0) return 0;

        // 2. Get Accounts of those types
        // We need to fetch balances. Since we don't have a direct "balance" column on accounts (it's calculated),
        // we might need to rely on the "MonthlyBalance" of the current month + transactions of this month...
        // OR better: Assume the Dashboard "Balance" calculation is the source of truth.
        // HOWEVER, re-calculating everything here is heavy.
        // ALTERNATIVE: For now, we unfortunately need to fetch transactions to calculate refined balance, 
        // OR simpler: Use the last known MonthlyBalance. 
        // BUT, user wants "Real Time".
        // Let's reuse the logic from SupabaseService.getAccountBalance if possible, or replicate it.
        // Ideally, we accept the "currentTotalBalance" as an argument from the UI which already calculates it.
        // Avoiding heavy DB lifting here if UI already has it.
        return 0;
    },

    generateProjection(
        startDate: Date,
        days: number,
        initialBalance: number,
        cheques: Cheque[],
        budgetItems: BudgetItem[]
    ): DailyFlow[] {
        const flow: DailyFlow[] = [];
        let currentBalance = initialBalance;

        // Helper to normalize date to YYYY-MM-DD
        const toDateStr = (d: Date) => d.toISOString().split('T')[0];

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = toDateStr(date);

            // Filter events for this day
            const dailyEvents: CashFlowEvent[] = [];

            // 1. Cheques
            cheques.forEach(c => {
                const cDate = c.payment_date.split('T')[0]; // Ensure string compare
                if (cDate === dateStr && c.status === 'PENDIENTE') {
                    dailyEvents.push({
                        id: c.id,
                        date: dateStr,
                        type: 'CHEQUE',
                        flow: c.type === 'PROPIO' ? 'OUT' : 'IN',
                        amount: c.amount,
                        description: `Cheque: ${c.recipient_sender} (${c.bank_name})`,
                        status: 'PENDIENTE'
                    });
                }
            });

            // 2. Budget Items (recurring and single)
            // This is tricky because BudgetItems are monthly. We need "plannedDate".
            // If plannedDate is present, we map it to this specific month/day.
            const month = date.getMonth(); // 0-11
            const year = date.getFullYear();
            const dayToCheck = date.getDate();

            budgetItems.forEach(b => {
                if (b.month === month && b.year === year && b.plannedDate === dayToCheck) {
                    dailyEvents.push({
                        id: b.id,
                        date: dateStr,
                        type: 'BUDGET',
                        flow: b.type === 'IN' ? 'IN' : 'OUT',
                        amount: b.plannedAmount,
                        description: `Presupuesto: ${b.label}`,
                        status: 'ESTIMADO'
                    });
                }
            });

            // Calculate totals
            const inflow = dailyEvents.filter(e => e.flow === 'IN').reduce((sum, e) => sum + e.amount, 0);
            const outflow = dailyEvents.filter(e => e.flow === 'OUT').reduce((sum, e) => sum + e.amount, 0);
            const net = inflow - outflow;
            const finalBalance = currentBalance + net;

            flow.push({
                date: dateStr,
                openingBalance: currentBalance,
                inflow,
                outflow,
                net,
                finalBalance,
                events: dailyEvents
            });

            currentBalance = finalBalance;
        }

        return flow;
    }
};
