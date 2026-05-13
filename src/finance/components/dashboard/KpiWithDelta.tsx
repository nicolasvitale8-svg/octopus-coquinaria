import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

/**
 * KpiWithDelta — KPI con deltas MoM y 3M.
 * Compacto: pensado para contenedores estrechos (1 col en columna lateral
 * del dashboard) y también para grilla horizontal en pantallas anchas.
 */

interface Props {
  label: string;
  value: number;
  prevValue: number | null;
  avg3M: number | null;
  accentColor: string;
  direction: 'higherIsBetter' | 'lowerIsBetter';
  icon?: React.ReactNode;
  onClick?: () => void;
}

const calcPct = (current: number, base: number | null): number | null => {
  if (base === null || base === undefined) return null;
  if (Math.abs(base) < 0.005) {
    if (Math.abs(current) < 0.005) return 0;
    return null;
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
      <div className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.10em] text-fin-muted">
        <Minus className="w-3 h-3 shrink-0" />
        <span>{baseLabel} —</span>
      </div>
    );
  }
  const rounded = Math.abs(pct) < 0.05 ? 0 : pct;
  const positiveChange = rounded > 0;
  const flatChange = Math.abs(rounded) < 0.05;
  const isGood =
    flatChange ||
    (direction === 'higherIsBetter' ? positiveChange : !positiveChange);
  const color = flatChange ? 'var(--text-muted)' : isGood ? 'var(--color-primary)' : 'var(--color-danger)';
  const Icon = flatChange ? Minus : positiveChange ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.10em]"
      style={{ color }}
      title={`${baseLabel}: ${pct.toFixed(1)}%`}
    >
      <Icon className="w-3 h-3 shrink-0" strokeWidth={2.5} />
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
      className={`relative w-full min-w-0 bg-fin-card border border-fin-border rounded-md p-3 overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:border-[var(--color-primary)]/40 active:scale-[0.99]' : ''
      }`}
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: accentColor }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: accentColor }} />

      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted truncate">{label}</div>
        {icon && <div className="shrink-0" style={{ color: accentColor }}>{icon}</div>}
      </div>

      <div className="font-mono text-lg font-bold tabular-nums leading-tight truncate" style={{ color: accentColor }} title={formatCurrency(value)}>
        {formatCurrency(value)}
      </div>

      <div className="mt-2 flex flex-col gap-0.5">
        <Delta pct={pctMoM} direction={direction} baseLabel="vs MES" />
        <Delta pct={pct3M} direction={direction} baseLabel="vs 3M" />
      </div>
    </div>
  );
};

export default KpiWithDelta;
