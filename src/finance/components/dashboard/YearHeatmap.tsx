import React, { useMemo, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Transaction, TransactionType } from '../../financeTypes';
import { formatCurrency, parseDate } from '../../utils/calculations';

/**
 * YearHeatmap — Grilla 12 × 3 (meses × Ingresos/Egresos/Neto) con intensidad
 * de color proporcional al valor de la celda respecto al máximo del año.
 * Sirve para ver de un vistazo qué meses fueron buenos, malos, atípicos.
 *
 * Reglas de color:
 *  - Ingresos: phosphor green, intensidad por |valor| / maxIn
 *  - Egresos: rojo (danger), intensidad por |valor| / maxOut
 *  - Neto: phosphor si ≥ 0, rojo si < 0; intensidad por |valor| / maxAbsNet
 *  - Meses futuros (sin tx): celdas en gris muy claro
 */

interface Props {
  transactions: Transaction[];
  year: number;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

interface MonthAgg { m: number; in: number; out: number; net: number; isFuture: boolean }

const YearHeatmap: React.FC<Props> = ({ transactions, year }) => {
  const [hover, setHover] = useState<{ row: 'in' | 'out' | 'net'; m: number } | null>(null);

  const data = useMemo<MonthAgg[]>(() => {
    const today = new Date();
    const currentMonthOfYear = today.getFullYear() > year ? 11 : (today.getFullYear() < year ? -1 : today.getMonth());

    const out: MonthAgg[] = [];
    for (let m = 0; m < 12; m++) {
      const monthTx = transactions.filter(t => {
        if (t.transferId) return false;
        const d = parseDate(t.date);
        return d.getMonth() === m && d.getFullYear() === year;
      });
      const inSum = monthTx.filter(t => t.type === TransactionType.IN).reduce((s, t) => s + t.amount, 0);
      const outSum = monthTx.filter(t => t.type === TransactionType.OUT).reduce((s, t) => s + t.amount, 0);
      out.push({
        m,
        in: inSum,
        out: outSum,
        net: inSum - outSum,
        isFuture: m > currentMonthOfYear,
      });
    }
    return out;
  }, [transactions, year]);

  const maxIn = Math.max(1, ...data.map(d => d.in));
  const maxOut = Math.max(1, ...data.map(d => d.out));
  const maxAbsNet = Math.max(1, ...data.map(d => Math.abs(d.net)));

  const cellColor = (row: 'in' | 'out' | 'net', md: MonthAgg): { bg: string; text: string } => {
    if (md.isFuture) return { bg: 'rgba(255,255,255,0.02)', text: 'var(--text-muted)' };
    if (row === 'in') {
      const intensity = md.in / maxIn;
      return {
        bg: `rgba(0, 255, 157, ${0.08 + intensity * 0.42})`,
        text: intensity > 0.5 ? 'var(--text-primary)' : 'var(--text-secondary)',
      };
    }
    if (row === 'out') {
      const intensity = md.out / maxOut;
      return {
        bg: `rgba(255, 77, 77, ${0.08 + intensity * 0.42})`,
        text: intensity > 0.5 ? 'var(--text-primary)' : 'var(--text-secondary)',
      };
    }
    // net
    const intensity = Math.abs(md.net) / maxAbsNet;
    if (md.net >= 0) {
      return {
        bg: `rgba(0, 255, 157, ${0.08 + intensity * 0.42})`,
        text: intensity > 0.5 ? 'var(--text-primary)' : 'var(--text-secondary)',
      };
    }
    return {
      bg: `rgba(255, 77, 77, ${0.08 + intensity * 0.42})`,
      text: intensity > 0.5 ? 'var(--text-primary)' : 'var(--text-secondary)',
    };
  };

  const fmtCompact = (v: number) => {
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${Math.round(v / 1_000)}K`;
    return String(Math.round(v));
  };

  const hovered = hover ? data[hover.m] : null;
  const hoveredValue = hover && hovered
    ? hover.row === 'in' ? hovered.in
    : hover.row === 'out' ? hovered.out
    : hovered.net
    : null;

  // Stats del año
  const totalIn = data.reduce((s, d) => s + d.in, 0);
  const totalOut = data.reduce((s, d) => s + d.out, 0);
  const monthsWithData = data.filter(d => d.in > 0 || d.out > 0).length;
  const bestNet = data.reduce((best, d) => (d.net > best.net ? d : best), data[0]);
  const worstNet = data.reduce((worst, d) => (d.net < worst.net ? d : worst), data[0]);

  return (
    <div className="bg-fin-card border border-fin-border rounded-md p-6 relative overflow-hidden">
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-3 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-3 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-fin-muted mb-1">— CPD-FIN-HMP-001</div>
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-[var(--color-primary)]" />
            Heatmap anual · {year}
          </h3>
          <p className="font-mono text-[11px] text-fin-muted mt-0.5">
            Patrón de flujo del año en una grilla. Intensidad = magnitud relativa al máximo.
          </p>
        </div>
        <div className="flex gap-4 text-right font-mono text-[10px]">
          <div>
            <div className="uppercase tracking-[0.18em] text-fin-muted">MEJOR</div>
            <div className="font-bold text-[var(--color-primary)]">{MONTHS[bestNet.m]}</div>
          </div>
          <div>
            <div className="uppercase tracking-[0.18em] text-fin-muted">PEOR</div>
            <div className="font-bold text-[var(--color-danger)]">{MONTHS[worstNet.m]}</div>
          </div>
        </div>
      </div>

      {/* Grilla: primera fila = labels meses; siguientes 3 filas = IN, OUT, NET */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header de meses */}
          <div className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-1 mb-1">
            <div />
            {MONTHS.map((m, i) => (
              <div key={m} className="font-mono text-[9px] uppercase tracking-[0.16em] text-fin-muted text-center">{m}</div>
            ))}
          </div>

          {/* Fila IN */}
          {(['in', 'out', 'net'] as const).map((row) => (
            <div key={row} className="grid grid-cols-[60px_repeat(12,minmax(0,1fr))] gap-1 mb-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fin-muted flex items-center">
                {row === 'in' ? 'INGRESOS' : row === 'out' ? 'EGRESOS' : 'NETO'}
              </div>
              {data.map(md => {
                const c = cellColor(row, md);
                const value = row === 'in' ? md.in : row === 'out' ? md.out : md.net;
                return (
                  <div
                    key={`${row}-${md.m}`}
                    className="aspect-square min-h-[36px] border flex items-center justify-center cursor-default transition-all hover:scale-110 hover:z-10 hover:relative"
                    style={{
                      background: c.bg,
                      borderColor: 'var(--border-subtle)',
                      color: c.text,
                    }}
                    onMouseEnter={() => setHover({ row, m: md.m })}
                    onMouseLeave={() => setHover(null)}
                    title={`${row === 'in' ? 'Ingresos' : row === 'out' ? 'Egresos' : 'Neto'} ${MONTHS[md.m]} ${year}: ${formatCurrency(value)}`}
                  >
                    <span className="font-mono text-[10px] font-bold">{value === 0 ? '—' : fmtCompact(value)}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip de hover + stats anuales */}
      <div className="mt-4 pt-4 border-t border-fin-border grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">TOTAL INGRESOS</div>
          <div className="font-mono text-sm font-bold text-[var(--color-primary)]">{formatCurrency(totalIn)}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">TOTAL EGRESOS</div>
          <div className="font-mono text-sm font-bold text-[var(--color-danger)]">{formatCurrency(totalOut)}</div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">BALANCE ANUAL</div>
          <div className="font-mono text-sm font-bold" style={{ color: totalIn - totalOut >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
            {formatCurrency(totalIn - totalOut)}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-fin-muted">
            {hovered ? `${hover!.row === 'in' ? 'INGRESOS' : hover!.row === 'out' ? 'EGRESOS' : 'NETO'} ${MONTHS[hover!.m]}` : 'MESES CON DATA'}
          </div>
          <div className="font-mono text-sm font-bold text-[var(--text-primary)]">
            {hoveredValue !== null ? formatCurrency(hoveredValue) : `${monthsWithData} / 12`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YearHeatmap;
