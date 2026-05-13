import React, { useMemo } from 'react';
import { Bell, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { BudgetItem, Category, TransactionType } from '../../financeTypes';
import { formatCurrency, getAdjustedWorkingDay } from '../../utils/calculations';

interface Props {
  budgetItems: BudgetItem[];
  categories: Category[];
  daysAhead?: number;
}

interface RowUpcoming {
  id: string;
  label: string;
  amount: number;
  daysLeft: number; // <0 = vencido
  dueDate: Date;
  categoryName: string;
  paid: boolean;
}

const UpcomingPayments: React.FC<Props> = ({ budgetItems, categories, daysAhead = 7 }) => {
  const { rows, totalOverdue, totalUpcoming } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Excluir aportes a Inversiones/Ahorro/Frasco (no son "deudas" reales, son aportes).
    const investmentCatIds = new Set(
      categories
        .filter(c => /inversi|ahorro|frasco/i.test(c.name) || c.type === 'MIX')
        .map(c => c.id),
    );

    const out: RowUpcoming[] = [];
    budgetItems.forEach(b => {
      if (b.type !== TransactionType.OUT) return;
      if (b.paidAt) return; // ya pagado
      if (investmentCatIds.has(b.categoryId)) return;
      const day = b.plannedDate || 1;
      // Construir la fecha de vencimiento en el mes/año del budget item
      const due = getAdjustedWorkingDay(day, b.month, b.year, false);
      due.setHours(0, 0, 0, 0);

      // Filtrar a [hoy-daysAhead, hoy+daysAhead] (incluye vencidos recientes)
      const diff = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      if (diff > daysAhead) return;
      if (diff < -daysAhead) return;

      out.push({
        id: b.id,
        label: b.label,
        amount: b.plannedAmount,
        daysLeft: diff,
        dueDate: due,
        categoryName: categories.find(c => c.id === b.categoryId)?.name || 'Sin categoría',
        paid: false,
      });
    });

    out.sort((a, b) => a.daysLeft - b.daysLeft);
    const totalOverdue = out.filter(r => r.daysLeft < 0).reduce((s, r) => s + r.amount, 0);
    const totalUpcoming = out.filter(r => r.daysLeft >= 0).reduce((s, r) => s + r.amount, 0);
    return { rows: out, totalOverdue, totalUpcoming };
  }, [budgetItems, categories, daysAhead]);

  if (rows.length === 0) {
    return (
      <div className="bg-fin-card border border-fin-border rounded-md p-6 relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-UPC-001</div>
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--color-primary)]" />
          Próximos vencimientos
        </h3>
        <p className="font-mono text-[11px] text-fin-muted mt-4 italic">[ Sin compromisos en los próximos {daysAhead} días ]</p>
      </div>
    );
  }

  const overdueCount = rows.filter(r => r.daysLeft < 0).length;

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-warning)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-warning)' }} />

      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-UPC-001</div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[var(--color-warning)]" />
            Próximos vencimientos · {daysAhead} días
          </h3>
        </div>
        <div className="flex gap-5 text-right">
          {totalOverdue > 0 && (
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">VENCIDOS</div>
              <div className="font-mono text-base font-bold text-[var(--color-danger)]">{formatCurrency(totalOverdue)}</div>
            </div>
          )}
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">PRÓXIMOS</div>
            <div className="font-mono text-base font-bold text-[var(--color-warning)]">{formatCurrency(totalUpcoming)}</div>
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">TOTAL A PAGAR</div>
            <div className="font-mono text-lg font-bold text-[var(--text-primary)]">{formatCurrency(totalOverdue + totalUpcoming)}</div>
          </div>
        </div>
      </div>

      {overdueCount > 0 && (
        <div
          className="mb-3 p-2 border-l-2 flex items-center gap-2 font-mono text-[11px]"
          style={{ borderColor: 'var(--color-danger)', background: 'rgba(255,77,77,0.08)', color: 'var(--color-danger)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {overdueCount} compromiso{overdueCount === 1 ? '' : 's'} vencido{overdueCount === 1 ? '' : 's'} pendiente{overdueCount === 1 ? '' : 's'}
        </div>
      )}

      <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {rows.map(r => {
          const isOverdue = r.daysLeft < 0;
          const isToday = r.daysLeft === 0;
          const color = isOverdue ? 'var(--color-danger)' : isToday ? 'var(--color-warning)' : 'var(--text-secondary)';
          const dayLabel = isOverdue
            ? `Vencido hace ${Math.abs(r.daysLeft)}d`
            : isToday ? 'HOY'
            : `En ${r.daysLeft}d`;
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 p-2.5 border bg-[var(--bg-base)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div
                className="w-9 h-9 border flex items-center justify-center font-mono text-[10px] font-bold"
                style={{ borderColor: color, color: color, background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="text-center leading-tight">
                  <CalendarIcon className="w-3 h-3 mx-auto" strokeWidth={1.75} />
                  <div className="mt-0.5">{r.dueDate.getDate()}</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] text-[var(--text-primary)] truncate">{r.label}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fin-muted">{r.categoryName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-sm font-bold text-[var(--text-primary)]">{formatCurrency(r.amount)}</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color }}>{dayLabel}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default UpcomingPayments;
