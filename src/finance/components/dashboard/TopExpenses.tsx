import React, { useMemo } from 'react';
import { ArrowDownRight, TrendingDown } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../../financeTypes';
import { formatCurrency, parseDate } from '../../utils/calculations';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
  topN?: number;
}

const TopExpenses: React.FC<Props> = ({ transactions, categories, month, year, topN = 5 }) => {
  const { items, totalMonth } = useMemo(() => {
    // Excluir categorías de tipo Inversiones/Ahorro/Frasco: son aportes propios,
    // no gastos reales.
    const investmentCatIds = new Set(
      categories
        .filter(c => /inversi|ahorro|frasco/i.test(c.name) || c.type === 'MIX')
        .map(c => c.id),
    );

    const monthTx = transactions.filter(t => {
      if (t.transferId) return false;
      if (t.type !== TransactionType.OUT) return false;
      if (investmentCatIds.has(t.categoryId)) return false;
      const d = parseDate(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const totalMonth = monthTx.reduce((s, t) => s + t.amount, 0);
    const sorted = [...monthTx].sort((a, b) => b.amount - a.amount).slice(0, topN);
    return { items: sorted, totalMonth };
  }, [transactions, categories, month, year, topN]);

  if (items.length === 0) {
    return (
      <div className="bg-fin-card border border-fin-border rounded-md p-6 relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-TOP-001</div>
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[var(--color-danger)]" />
          Top {topN} egresos del mes
        </h3>
        <p className="font-mono text-[11px] text-fin-muted mt-4 italic">[ Sin egresos este mes ]</p>
      </div>
    );
  }

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-danger)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-danger)' }} />

      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-TOP-001</div>
      <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <TrendingDown className="w-4 h-4 text-[var(--color-danger)]" />
        Top {topN} egresos del mes
      </h3>

      <ul className="space-y-2">
        {items.map((t, idx) => {
          const cat = categories.find(c => c.id === t.categoryId);
          const pct = totalMonth > 0 ? (t.amount / totalMonth) * 100 : 0;
          return (
            <li
              key={t.id}
              className="relative border bg-[var(--bg-base)] p-3 overflow-hidden"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {/* Bar de % al fondo */}
              <div
                className="absolute top-0 left-0 bottom-0"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  background: 'rgba(255,77,77,0.08)',
                  pointerEvents: 'none',
                }}
              />
              <div className="relative flex items-center gap-3">
                <span className="font-mono text-[10px] font-bold text-fin-muted w-5">{String(idx + 1).padStart(2, '0')}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">{t.description || '—'}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fin-muted">
                    {cat?.name || 'Sin categoría'} · {t.date}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-sm font-bold text-[var(--color-danger)]">
                    {formatCurrency(t.amount)}
                  </div>
                  <div className="font-mono text-[10px] text-fin-muted">{pct.toFixed(1)}%</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 pt-3 border-t border-fin-border flex justify-between items-center font-mono text-[11px]">
        <span className="uppercase tracking-[0.22em] text-fin-muted">Total mes</span>
        <span className="font-bold text-[var(--text-primary)]">{formatCurrency(totalMonth)}</span>
      </div>
    </div>
  );
};

export default TopExpenses;
