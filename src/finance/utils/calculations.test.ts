import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    parseDate,
    calculateJar,
    getAdjustedWorkingDay,
    calculatePeriodBalance,
    getProposedOpeningBalance,
    calculateAccountBalances,
    formatCurrency,
    formatPercentage,
} from './calculations';
import { TransactionType, Jar, Transaction, Account, MonthlyBalance } from '../financeTypes';

// ---------- Helpers ----------
const mkTx = (over: Partial<Transaction>): Transaction => ({
    id: 'tx1',
    date: '2026-03-10',
    categoryId: 'cat1',
    description: 'test',
    amount: 100,
    type: TransactionType.IN,
    accountId: 'acc1',
    ...over,
});

const account: Account = { id: 'acc1', name: 'Caja' } as Account;

describe('parseDate', () => {
    it('parsea YYYY-MM-DD en zona horaria local (sin desfase UTC)', () => {
        const d = parseDate('2026-03-01');
        expect(d.getFullYear()).toBe(2026);
        expect(d.getMonth()).toBe(2); // marzo
        expect(d.getDate()).toBe(1); // NO 28/2 (bug UTC-3)
    });

    it('parsea fin de año correctamente', () => {
        const d = parseDate('2025-12-31');
        expect(d.getDate()).toBe(31);
        expect(d.getMonth()).toBe(11);
    });
});

describe('calculateJar (interés compuesto diario)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 0, 31)); // 31/1/2026
    });
    afterEach(() => vi.useRealTimers());

    const jar: Jar = {
        id: 'j1',
        accountId: 'acc1',
        name: 'Plazo test',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        principal: 100000,
        annualRate: 36.5, // tasa diaria = 0.1%
    };

    it('calcula días transcurridos y restantes', () => {
        const r = calculateJar(jar);
        expect(r.daysTotal).toBe(364);
        expect(r.daysElapsed).toBe(30);
        expect(r.daysRemaining).toBe(334);
    });

    it('calcula el valor actual con capitalización diaria', () => {
        const r = calculateJar(jar);
        // 100000 * (1.001)^30
        expect(r.currentValue).toBeCloseTo(100000 * Math.pow(1.001, 30), 2);
        expect(r.interestAccrued).toBeCloseTo(r.currentValue - 100000, 6);
    });

    it('no excede daysTotal cuando el plazo venció', () => {
        vi.setSystemTime(new Date(2027, 5, 1));
        const r = calculateJar(jar);
        expect(r.daysElapsed).toBe(r.daysTotal);
        expect(r.daysRemaining).toBe(0);
    });

    it('daysElapsed es 0 si el plazo no comenzó', () => {
        vi.setSystemTime(new Date(2025, 11, 1));
        const r = calculateJar(jar);
        expect(r.daysElapsed).toBe(0);
    });
});

describe('getAdjustedWorkingDay', () => {
    // Febrero 2026: el 1 cae domingo, el 7 cae sábado
    it('domingo pasa a lunes por defecto', () => {
        const d = getAdjustedWorkingDay(1, 1, 2026);
        expect(d.getDay()).toBe(1); // lunes
        expect(d.getDate()).toBe(2);
    });

    it('domingo retrocede a viernes con fallbackToFriday', () => {
        const d = getAdjustedWorkingDay(1, 1, 2026, true);
        expect(d.getDay()).toBe(5); // viernes
        expect(d.getDate()).toBe(30); // 30/1
    });

    it('sábado pasa a lunes por defecto', () => {
        const d = getAdjustedWorkingDay(7, 1, 2026);
        expect(d.getDay()).toBe(1);
        expect(d.getDate()).toBe(9);
    });

    it('día hábil queda igual', () => {
        const d = getAdjustedWorkingDay(4, 1, 2026); // miércoles
        expect(d.getDate()).toBe(4);
    });
});

describe('calculatePeriodBalance', () => {
    const balances: MonthlyBalance[] = [
        { id: 'mb1', accountId: 'acc1', year: 2026, month: 2, amount: 5000 },
    ];
    const txs: Transaction[] = [
        mkTx({ id: 't1', amount: 1000, type: TransactionType.IN }),
        mkTx({ id: 't2', amount: 300, type: TransactionType.OUT }),
        mkTx({ id: 't3', amount: 999, date: '2026-04-10' }), // otro mes: fuera
        mkTx({ id: 't4', amount: 888, accountId: 'acc2' }), // otra cuenta: fuera
    ];

    it('suma apertura + ingresos - egresos del período', () => {
        const r = calculatePeriodBalance(account, txs, balances, 2, 2026);
        expect(r.openingBalance).toBe(5000);
        expect(r.totalIn).toBe(1000);
        expect(r.totalOut).toBe(300);
        expect(r.finalBalance).toBe(5700);
        expect(r.hasOpeningRecord).toBe(true);
    });

    it('sin registro de apertura arranca en 0', () => {
        const r = calculatePeriodBalance(account, txs, [], 2, 2026);
        expect(r.openingBalance).toBe(0);
        expect(r.finalBalance).toBe(700);
        expect(r.hasOpeningRecord).toBe(false);
    });
});

describe('getProposedOpeningBalance', () => {
    it('propone el cierre del mes anterior como apertura', () => {
        const balances: MonthlyBalance[] = [
            { id: 'mb1', accountId: 'acc1', year: 2026, month: 2, amount: 5000 },
        ];
        const txs = [mkTx({ amount: 1000 }), mkTx({ id: 't2', amount: 300, type: TransactionType.OUT })];
        expect(getProposedOpeningBalance('acc1', txs, balances, 3, 2026)).toBe(5700);
    });

    it('cruza el año: enero toma diciembre del año anterior', () => {
        const balances: MonthlyBalance[] = [
            { id: 'mb1', accountId: 'acc1', year: 2025, month: 11, amount: 2000 },
        ];
        const txs = [mkTx({ date: '2025-12-15', amount: 500 })];
        expect(getProposedOpeningBalance('acc1', txs, balances, 0, 2026)).toBe(2500);
    });
});

describe('calculateAccountBalances', () => {
    it('balance global = ingresos - egresos por cuenta', () => {
        const txs = [
            mkTx({ amount: 1000 }),
            mkTx({ id: 't2', amount: 400, type: TransactionType.OUT }),
            mkTx({ id: 't3', amount: 999, accountId: 'acc2' }),
        ];
        const r = calculateAccountBalances([account], txs);
        expect(r[0].currentBalance).toBe(600);
    });
});

describe('formatCurrency / formatPercentage', () => {
    it('formatea ARS es-AR con 2 decimales', () => {
        const s = formatCurrency(1234.5);
        expect(s).toContain('1.234,50');
        expect(s).toContain('$');
    });

    it('formatea porcentaje con 1 decimal', () => {
        expect(formatPercentage(0.1234)).toBe('12.3%');
        expect(formatPercentage(1)).toBe('100.0%');
    });
});
