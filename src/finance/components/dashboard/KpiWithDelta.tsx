import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

/**
 * KpiWithDelta — KPI principal con deltas MoM (mes anterior) y 3M (promedio 3 meses).
 *
 * - direction = 'higherIsBetter' (ingresos, balance) → ↑ verde / ↓ rojo
 * - direction = 'lowerIsBetter' (egresos)             → ↑ rojo / ↓ verde
 */

interface Props {
  label: string;
  value: number;
  prevValue: number | null;   // mes anterior
  avg3M: number | null;       // promedio 3M previos
  accentColor: string;        // color del número grande
  direction: 'higherIsBetter' | 'lowerIsBetter';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const calcPct = (current: number, base: number | null): number | null => {
  if (base === null || base === undefined) return null;
  if (Math.abs(base) < 0.005) {
    if (Math.abs(current) < 0.005) return 0;
    return null; // infinito → no mostrar %
  }
  return ((current - base) / Math.abs(base)) * 100;
};

const Delta: React.FC<{
  pct: number | null;
  direction: Props['direction'];
  baseLabel: string;
}> = ({ pct, direction, baseLabel }) => {
  if (pct === null) {
    return (
      <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-fin-muted">
        <Minus className="w-3 h-3" /> {baseLabel}: —
      </div>
    );
  }
  const rounded = Math.abs(pct) < 0.05 ? 0 : pct;
  const positiveChange = rounded > 0;
  const flatChange = Math.abs(rounded) < 0.05;
  // Para egresos, ↑ es malo
  const isGood =
    flatChange ||
    (direction === 'higherIsBetter' ? positiveChange : !positiveChange);
  const color = flatChange ? 'var(--text-muted)' : isGood ? 'var(--color-primary)' : 'var(--color-danger)';
  const Icon = flatChange ? Minus : positiveChange ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em]"
      style={{ color }}
      title={`${baseLabel}: ${pct.toFixed(1)}%`}
    >
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      <span className="font-bold">{positiveChange ? '+' : ''}{rounded.toFixed(1)}%</span>
      <span className="text-fin-muted">{baseLabel}</span>
    </div>
  );
};

const KpiWithDelta: React.FC<Props> = ({
  label,
  value,
  prevValue,
  avg3M,
  accentColor,
  direction,
  icon,
  onClick,
}) => {
  const pctMoM = calcPct(value, prevValue);
  const pct3M = calcPct(value, avg3M);

  return (
    <div
      onClick={onClick}
      className={`relative bg-fin-card border border-fin-border rounded-md p-5 overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:border-[var(--color-primary)]/40 active:scale-[0.99]' : ''
      }`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: accentColor }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: accentColor }} />

      <div className="flex items-center justify-between mb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fin-muted">{label}</div>
        {icon && <div style={{ color: accentColor }}>{icon}</div>}
      </div>

      <div className="font-mono text-2xl font-bold tabular-nums leading-tight" style={{ color: accentColor }}>
        {formatCurrency(value)}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        <Delta pct={pctMoM} direction={direction} baseLabel="vs MES" />
        <Delta pct={pct3M} direction={direction} baseLabel="vs 3M" />
      </div>
    </div>
  );
};

export default KpiWithDelta;
