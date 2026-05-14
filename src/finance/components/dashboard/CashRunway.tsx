import React, { useMemo } from 'react';
import { Hourglass, TrendingDown, TrendingUp } from 'lucide-react';
import { Account, MonthlyBalance, Transaction, TransactionType } from '../../financeTypes';
import { calculatePeriodBalance, formatCurrency, parseDate } from '../../utils/calculations';

/**
 * CashRunway — "Con la caja actual y el burn rate de los últimos 3 meses,
 * te quedan X meses de runway."
 *
 * Cash actual: suma de saldos finales del mes activo en cuentas operativas
 * (no inversiones/frascos).
 * Burn rate mensual: promedio de (egresos − ingresos) de los últimos 3 meses
 * cerrados (excluye mes en curso, parcial).
 *  - Si burn ≤ 0  → estás ahorrando neto, runway "infinito".
 *  - Si burn > 0  → runway = cash / burn (en meses).
 */

interface Props {
  accounts: Account[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
  currentMonth: number;
  currentYear: number;
}

const tierColor = (runway: number | null) => {
  if (runway === null) return 'var(--color-primary)';
  if (runway >= 24) return 'var(--color-primary)';
  if (runway >= 12) return 'var(--color-warning)';
  if (runway >= 6) return '#ff8c42';
  return 'var(--color-danger)';
};

const tierLabel = (runway: number | null) => {
  if (runway === null) return 'AHORRANDO NETO';
  if (runway >= 24) return 'SOSTENIBLE';
  if (runway >= 12) return 'ESTABLE';
  if (runway >= 6) return 'AJUSTADO';
  return 'CRÍTICO';
};

const formatRunway = (runway: number | null): { value: string; unit: string } => {
  if (runway === null) return { value: '∞', unit: 'meses' };
  if (runway < 1) {
    const days = Math.round(runway * 30);
    return { value: String(days), unit: days === 1 ? 'día' : 'días' };
  }
  if (runway >= 24) {
    const years = (runway / 12);
    return { value: years.toFixed(1), unit: 'años' };
  }
  return { value: runway.toFixed(1), unit: 'meses' };
};

const CashRunway: React.FC<Props> = ({ accounts, monthlyBalances, transactions, currentMonth, currentYear }) => {
  const data = useMemo(() => {
    // 1) Cash actual: saldo agregado de cuentas operativas al cierre del mes activo.
    //    Excluye cuentas tipo inversión (asumimos isActive=true para todas las cuentas
    //    a evaluar; el filtrado fino de "operativas" lo hace el campo del AccountType
    //    pero no lo tenemos a mano acá, así que usamos todas las activas).
    let cash = 0;
    accounts.filter(a => a.isActive !== false).forEach(acc => {
      const period = calculatePeriodBalance(acc, transactions, monthlyBalances, currentMonth, currentYear);
      cash += period.finalBalance;
    });

    // 2) Burn rate: promedio mensual de (OUT − IN) en los 3 meses anteriores
    //    al activo (cerrados → no se contaminan con datos parciales del mes en curso).
    let totalNet = 0;
    let count = 0;
    for (let off = 1; off <= 3; off++) {
      const d = new Date(currentYear, currentMonth - off, 1);
      const m = d.getMonth(), y = d.getFullYear();
      const monthTx = transactions.filter(t => {
        if (t.transferId) return false;
        const dd = parseDate(t.date);
        return dd.getMonth() === m && dd.getFullYear() === y;
      });
      const inSum = monthTx.filter(t => t.type === TransactionType.IN).reduce((s, t) => s + t.amount, 0);
      const outSum = monthTx.filter(t => t.type === TransactionType.OUT).reduce((s, t) => s + t.amount, 0);
      totalNet += (outSum - inSum); // burn positivo = consumís caja
      count++;
    }
    const burnRate = count > 0 ? totalNet / count : 0;

    // 3) Runway
    let runway: number | null = null;
    if (burnRate > 0 && cash > 0) {
      runway = cash / burnRate;
    } else if (burnRate <= 0) {
      runway = null; // ahorrando neto → infinito
    } else if (cash <= 0) {
      runway = 0; // ya estás en rojo
    }

    return { cash, burnRate, runway };
  }, [accounts, monthlyBalances, transactions, currentMonth, currentYear]);

  const { cash, burnRate, runway } = data;
  const color = tierColor(runway);
  const label = tierLabel(runway);
  const { value, unit } = formatRunway(runway);

  // Para el bar de progreso visual: cap a 36 meses (3 años) para no distorsionar
  const barPct = runway === null
    ? 100
    : Math.min(100, (runway / 36) * 100);

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: color }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: color }} />

      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-RWY-001</div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Hourglass className="w-4 h-4" style={{ color }} />
            Cash Runway
          </h3>
          <p className="font-mono text-[11px] text-fin-muted mt-0.5">
            Cuánto dura tu caja al ritmo de consumo de los últimos 3 meses.
          </p>
        </div>
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] px-3 py-1 border"
          style={{ background: 'transparent', color, borderColor: color }}
        >
          {label}
        </span>
      </div>

      {/* Valor principal */}
      <div className="flex items-baseline gap-3 mb-4">
        <div className="font-mono text-5xl font-bold tabular-nums leading-none" style={{ color }}>
          {value}
        </div>
        <div className="font-mono text-sm uppercase tracking-[0.22em]" style={{ color: 'var(--text-muted)' }}>
          {unit}
        </div>
      </div>

      {/* Bar de progreso (cap a 36 meses) */}
      <div className="relative h-1.5 bg-[var(--bg-base)] border border-fin-border overflow-hidden mb-4">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${barPct}%`, background: color }}
        />
        {/* Marcas a 6, 12, 24 meses (porcentajes sobre 36) */}
        <div className="absolute inset-y-0" style={{ left: `${(6/36)*100}%`, width: 1, background: 'var(--text-muted)', opacity: 0.4 }} />
        <div className="absolute inset-y-0" style={{ left: `${(12/36)*100}%`, width: 1, background: 'var(--text-muted)', opacity: 0.4 }} />
        <div className="absolute inset-y-0" style={{ left: `${(24/36)*100}%`, width: 1, background: 'var(--text-muted)', opacity: 0.4 }} />
      </div>
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted mb-5">
        <span>0</span>
        <span>6M</span>
        <span>12M</span>
        <span>24M</span>
        <span>36M+</span>
      </div>

      {/* Mini-KPIs */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-fin-border">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted mb-1">Caja actual</div>
          <div className="font-mono text-sm font-bold tabular-nums" style={{ color: cash < 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {formatCurrency(cash)}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted mb-1 flex items-center gap-1">
            {burnRate > 0 ? <TrendingDown className="w-3 h-3" style={{ color: 'var(--color-danger)' }} /> : <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />}
            {burnRate > 0 ? 'Burn rate 3M' : 'Ahorro 3M'}
          </div>
          <div className="font-mono text-sm font-bold tabular-nums" style={{ color: burnRate > 0 ? 'var(--color-danger)' : 'var(--color-primary)' }}>
            {formatCurrency(Math.abs(burnRate))}<span className="text-fin-muted text-xs"> /mes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRunway;
