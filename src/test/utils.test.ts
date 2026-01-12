import { describe, it, expect } from 'vitest';

// Test para funciones utilitarias que podríamos usar

describe('Finance Calculations', () => {
    describe('Number Formatting', () => {
        const formatCurrency = (amount: number, currency = 'ARS') => {
            return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency
            }).format(amount);
        };

        it('formats positive numbers correctly', () => {
            expect(formatCurrency(1000)).toContain('1.000');
        });

        it('formats negative numbers correctly', () => {
            const result = formatCurrency(-500);
            expect(result).toContain('500');
        });

        it('formats decimals correctly', () => {
            const result = formatCurrency(1234.56);
            expect(result).toContain('1.234');
        });
    });

    describe('Date Utilities', () => {
        const getMonthName = (month: number) => {
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            return months[month];
        };

        it('returns correct month name for January', () => {
            expect(getMonthName(0)).toBe('Enero');
        });

        it('returns correct month name for December', () => {
            expect(getMonthName(11)).toBe('Diciembre');
        });
    });

    describe('Balance Calculations', () => {
        const calculateBalance = (
            transactions: { amount: number; type: 'IN' | 'OUT' }[]
        ) => {
            return transactions.reduce((acc, t) => {
                return t.type === 'IN' ? acc + t.amount : acc - t.amount;
            }, 0);
        };

        it('calculates simple balance correctly', () => {
            const transactions = [
                { amount: 1000, type: 'IN' as const },
                { amount: 300, type: 'OUT' as const }
            ];
            expect(calculateBalance(transactions)).toBe(700);
        });

        it('handles empty transactions', () => {
            expect(calculateBalance([])).toBe(0);
        });

        it('handles multiple transactions', () => {
            const transactions = [
                { amount: 500, type: 'IN' as const },
                { amount: 200, type: 'OUT' as const },
                { amount: 1000, type: 'IN' as const },
                { amount: 100, type: 'OUT' as const }
            ];
            expect(calculateBalance(transactions)).toBe(1200);
        });
    });
});

describe('Validation Utilities', () => {
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    it('validates correct email', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('rejects invalid email', () => {
        expect(isValidEmail('invalid-email')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(isValidEmail('')).toBe(false);
    });
});
