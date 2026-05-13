import React, { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { BudgetItem, Category, Transaction, TransactionType } from '../../financeTypes';
import { formatCurrency, parseDate } from '../../utils/calculations';

interface Props {
  budgetItems: BudgetItem[];
  transactions: Transaction[];
  categories: Category[];
  month: number;
  year: number;
}

interface Row {
  categoryId: string;
  name: string;
  planned: number;
  actual: number;
  pct: number;
  status: 'good' | 'warning' | 'critical' | 'over' | 'noplan';
}

const statusColor = (s: Row['status']) => {
  switch (s) {
    case 'good': return 'var(--color-primary)';
    case 'warning': return 'var(--color-warning)';
    case 'critical': return '#ff8c42';
    case 'over': return 'var(--color-danger)';
    case 'noplan': return 'var(--text-muted)';
  }
};

const statusLabel = (s: Row['status']) => {
  switch (s) {
    case 'good': return 'OK';
    case 'warning': return 'ATENCIÓN';
    case 'critical': return 'CRÍTICO';
    case 'over': return 'EXCEDIDO';
    case 'noplan': return 'SIN PRESUPUESTO';
  }
};

const BudgetTrafficLight: React.FC<Props> = ({ budgetItems, transactions, categories, month, year }) => {
  const rows = useMemo<Row[]>(() => {
    // Excluir categorías de tipo Inversiones/Ahorro/Frasco (aportes propios).
    const investmentCatIds = new Set(
      categories
        .filter(c => /inversi|ahorro|frasco/i.test(c.name) || c.type === 'MIX')
        .map(c => c.id),
    );

    // Agrupar presupuesto por categoría
    const plannedByCat = new Map<string, number>();
    budgetItems
      .filter(b =>
        b.year === year &&
        b.month === month &&
        b.type === TransactionType.OUT &&
        !investmentCatIds.has(b.categoryId),
      )
      .forEach(b => {
        plannedByCat.set(b.categoryId, (plannedByCat.get(b.categoryId) || 0) + b.plannedAmount);
      });

    // Agrupar gasto real por categoría
    const actualByCat = new Map<string, number>();
    transactions
      .filter(t => {
        if (t.transferId) return false;
        if (t.type !== TransactionType.OUT) return false;
        if (investmentCatIds.has(t.categoryId)) return false;
        const d = parseDate(t.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .forEach(t => {
        actualByCat.set(t.categoryId, (actualByCat.get(t.categoryId) || 0) + t.amount);
      });

    // Unión de categoryIds con plan o real
    const allCatIds = new Set<string>([...plannedByCat.keys(), ...actualByCat.keys()]);

    const out: Row[] = [];
    allCatIds.forEach(catId => {
      const planned = plannedByCat.get(catId) || 0;
      const actual = actualByCat.get(catId) || 0;
      if (planned === 0 && actual === 0) return;
      // Si no hay plan → "SIN PRESUPUESTO" (no es excedido, es no planeado).
      // El % se muestra como 100% (barra llena gris) para visualizar el monto.
      const noPlan = planned === 0;
      const pct = noPlan ? 100 : (actual / planned) * 100;
      let status: Row['status'] = 'good';
      if (noPlan) status = 'noplan';
      else if (pct > 100) status = 'over';
      else if (pct > 90) status = 'critical';
      else if (pct > 75) status = 'warning';
      out.push({
        categoryId: catId,
        name: categories.find(c => c.id === catId)?.name || 'Sin categoría',
        planned,
        actual,
        pct,
        status,
      });
    });

    // Orden: primero EXCEDIDO/CRÍTICO, después por monto real desc, NOPLAN al final.
    return out.sort((a, b) => {
      if (a.status === 'noplan' && b.status !== 'noplan') return 1;
      if (b.status === 'noplan' && a.status !== 'noplan') return -1;
      return b.pct - a.pct;
    });
  }, [budgetItems, transactions, categories, month, year]);

  if (rows.length === 0) {
    return (
      <div className="bg-fin-card border border-fin-border rounded-md p-6 relative">
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-TLT-001</div>
        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Gauge className="w-4 h-4 text-[var(--color-primary)]" />
          Semáforo de presupuesto
        </h3>
        <p className="font-mono text-[11px] text-fin-muted mt-4 italic">[ Sin presupuesto cargado para este mes ]</p>
      </div>
    );
  }

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-TLT-001</div>
      <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
        <Gauge className="w-4 h-4 text-[var(--color-primary)]" />
        Semáforo de presupuesto · ejecución por categoría
      </h3>

      <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {rows.map(r => (
          <li key={r.categoryId} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-primary)] truncate">{r.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] px-1.5 py-0.5 border"
                  style={{ color: statusColor(r.status), borderColor: statusColor(r.status), background: 'transparent' }}
                >
                  {statusLabel(r.status)}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--text-primary)] w-12 text-right">
                  {r.planned > 0 ? `${r.pct.toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>
            {/* Barra */}
            <div className="relative h-1.5 bg-[var(--bg-base)] border border-fin-border overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 transition-all"
                style={{
                  width: `${Math.min(r.pct, 100)}%`,
                  background: statusColor(r.status),
                }}
              />
              {r.pct > 100 && (
                <div
                  className="absolute inset-y-0 right-0 w-1"
                  style={{ background: 'var(--color-danger)' }}
                  title={`Excede en ${(r.pct - 100).toFixed(0)}%`}
                />
              )}
            </div>
            <div className="flex justify-between font-mono text-[10px] text-fin-muted">
              <span>{formatCurrency(r.actual)} real</span>
              <span>{r.planned > 0 ? `${formatCurrency(r.planned)} plan` : 'sin plan'}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BudgetTrafficLight;
