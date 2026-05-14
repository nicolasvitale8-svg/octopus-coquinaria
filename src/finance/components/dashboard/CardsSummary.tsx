import React, { useMemo } from 'react';
import { CreditCard, ChevronRight, Lock } from 'lucide-react';
import { Account, BudgetItem, TransactionType } from '../../financeTypes';
import type { Loan, LoanPayment } from '../../services/loanService';
import { formatCurrency } from '../../utils/calculations';

/**
 * CardsSummary — Resumen consolidado por tarjeta de crédito.
 * Para cada tarjeta muestra:
 *  - Total a pagar este mes (cuotas pendientes del budget asociadas a esa
 *    tarjeta vía account_id)
 *  - Préstamos activos (cantidad y saldo total pendiente)
 *  - Cuotas restantes del préstamo más lejano
 *  - Estado: con/sin pendientes
 */

interface Props {
  cards: Account[]; // tarjetas de crédito ya filtradas
  loans: Loan[];
  loanPaymentsMap: Record<string, LoanPayment[]>;
  budgetItems: BudgetItem[];
  currentMonth: number;
  currentYear: number;
  onPayCard?: (cardId: string) => void; // dispara modal de pago consolidado
}

interface CardSummary {
  card: Account;
  monthTotal: number;
  monthCount: number;
  paidThisMonth: number;
  activeLoans: Loan[];
  remainingDebt: number;
  longestRemainingInstallments: number;
}

const CardsSummary: React.FC<Props> = ({
  cards,
  loans,
  loanPaymentsMap,
  budgetItems,
  currentMonth,
  currentYear,
  onPayCard,
}) => {
  const summaries = useMemo<CardSummary[]>(() => {
    return cards.map(card => {
      // Cuotas presupuestadas del mes asociadas a esta tarjeta
      const monthItems = budgetItems.filter(
        b => b.accountId === card.id && b.year === currentYear && b.month === currentMonth,
      );
      const pendingItems = monthItems.filter(b => !b.paidAt);
      const paidItems = monthItems.filter(b => !!b.paidAt);
      const monthTotal = pendingItems.reduce((s, b) => s + (b.plannedAmount || 0), 0);
      const monthCount = pendingItems.length;
      const paidThisMonth = paidItems.reduce((s, b) => s + (b.plannedAmount || 0), 0);

      // Préstamos activos asociados a esta tarjeta
      const activeLoans = loans.filter(
        l => l.account_id === card.id && l.status === 'ACTIVO' && l.direction !== 'GIVEN',
      );

      // Saldo pendiente total (suma de cuotas no pagadas × installment_amount)
      let remainingDebt = 0;
      let longestRemainingInstallments = 0;
      activeLoans.forEach(l => {
        const payments = loanPaymentsMap[l.id] || [];
        const paid = payments.filter(p => p.status === 'PAGADA').length;
        const remaining = Math.max(0, (l.total_installments || 1) - paid);
        remainingDebt += remaining * Number(l.installment_amount || 0);
        if (remaining > longestRemainingInstallments) longestRemainingInstallments = remaining;
      });

      return {
        card,
        monthTotal,
        monthCount,
        paidThisMonth,
        activeLoans,
        remainingDebt,
        longestRemainingInstallments,
      };
    });
  }, [cards, loans, loanPaymentsMap, budgetItems, currentMonth, currentYear]);

  if (cards.length === 0) {
    return (
      <div className="bg-fin-card border border-fin-border rounded-md p-6 relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-CRD-001</div>
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[var(--color-primary)]" />
          Resumen de tarjetas
        </h3>
        <p className="font-mono text-[11px] text-fin-muted mt-4 italic">[ Sin tarjetas de crédito configuradas ]</p>
      </div>
    );
  }

  // Totales agregados
  const totalMonth = summaries.reduce((s, c) => s + c.monthTotal, 0);
  const totalDebt = summaries.reduce((s, c) => s + c.remainingDebt, 0);
  const totalActiveLoans = summaries.reduce((s, c) => s + c.activeLoans.length, 0);

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-warning)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-warning)' }} />

      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-CRD-001</div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[var(--color-warning)]" />
            Resumen de tarjetas · {cards.length} {cards.length === 1 ? 'activa' : 'activas'}
          </h3>
          <p className="font-mono text-[11px] text-fin-muted mt-0.5">
            Total a pagar del mes + saldo pendiente por préstamos asociados.
          </p>
        </div>
        <div className="flex gap-5 text-right">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">ESTE MES</div>
            <div className="font-mono text-base font-bold text-[var(--color-warning)]">{formatCurrency(totalMonth)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">DEUDA TOTAL</div>
            <div className="font-mono text-base font-bold text-[var(--color-danger)]">{formatCurrency(totalDebt)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">PRÉSTAMOS</div>
            <div className="font-mono text-base font-bold text-[var(--text-primary)]">{totalActiveLoans}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {summaries.map(s => {
          const hasPending = s.monthCount > 0;
          return (
            <div
              key={s.card.id}
              className="relative border p-4"
              style={{
                background: 'var(--bg-base)',
                borderColor: hasPending ? 'var(--color-warning)' : 'var(--border-subtle)',
              }}
            >
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard
                    className="w-4 h-4 shrink-0"
                    style={{ color: hasPending ? 'var(--color-warning)' : 'var(--text-muted)' }}
                  />
                  <span className="font-display text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {s.card.name}
                  </span>
                </div>
                {s.card.creditLimit ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-fin-muted">
                    Límite {formatCurrency(s.card.creditLimit)}
                  </span>
                ) : null}
              </div>

              {/* Total del mes */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-fin-muted">
                  A pagar este mes
                </span>
                <span
                  className="font-mono text-lg font-bold tabular-nums"
                  style={{ color: hasPending ? 'var(--color-warning)' : 'var(--text-muted)' }}
                >
                  {formatCurrency(s.monthTotal)}
                </span>
              </div>

              {/* Línea de cuotas pendientes / pagado */}
              <div className="flex flex-wrap gap-2 text-[10px] font-mono mb-3">
                <span className="font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-secondary)' }}>
                  {s.monthCount} cuota{s.monthCount === 1 ? '' : 's'} pendiente{s.monthCount === 1 ? '' : 's'}
                </span>
                {s.paidThisMonth > 0 && (
                  <span className="font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--color-primary)' }}>
                    · pagado {formatCurrency(s.paidThisMonth)}
                  </span>
                )}
              </div>

              {/* Préstamos asociados */}
              {s.activeLoans.length > 0 && (
                <div className="pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">
                      Préstamos activos · {s.activeLoans.length}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">
                      máx {s.longestRemainingInstallments} cuotas
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold tabular-nums" style={{ color: 'var(--color-danger)' }}>
                    Deuda pendiente: {formatCurrency(s.remainingDebt)}
                  </div>
                </div>
              )}

              {/* CTA pagar resumen */}
              {hasPending && onPayCard && (
                <button
                  onClick={() => onPayCard(s.card.id)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-2 border transition-colors"
                  style={{
                    background: 'rgba(255,177,42,0.10)',
                    color: 'var(--color-warning)',
                    borderColor: 'var(--color-warning)',
                  }}
                >
                  Pagar resumen
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
              {!hasPending && (
                <div
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] px-3 py-2 border"
                  style={{
                    background: 'rgba(0,255,157,0.06)',
                    color: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)',
                  }}
                >
                  <Lock className="w-3 h-3" />
                  Sin pendientes este mes
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardsSummary;
