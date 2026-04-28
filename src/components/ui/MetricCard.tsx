import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * MetricCard — primitivo único para tiles de KPI.
 *
 * Reemplaza los bloques ad-hoc del Dashboard:
 *   - "Volumen de Ventas (Fuerza de Venta)" + número grande
 *   - "Margen Bruto" + gauge
 *   - "Costo de Ventas (Insumos)" + gauge
 *   - cualquier KPI suelto en /admin/dashboard, /finanzaflow, /procurement
 *
 * Reglas:
 *   - SIEMPRE label arriba en mono uppercase tracking, icon optional al lado.
 *   - Value es lo más grande de la tarjeta. Numérica → font-mono.
 *   - Delta opcional con flecha + color por tone.
 *   - Children: para gauges, sparks o cualquier viz extra debajo del valor.
 *   - tone determina el color del icon-badge y del delta.
 *
 * tones:
 *   - "neutral"  → cream (default).
 *   - "primary"  → gold (estado óptimo, foco de marca).
 *   - "success"  → verde (mejora, on-target).
 *   - "warning"  → amarillo (atención).
 *   - "danger"   → rojo (alerta, off-target).
 *   - "cyan"     → cyan-tech (datos técnicos secundarios).
 *
 * delta:
 *   - direction "up" / "down" / "flat".
 *   - value numérico opcional + suffix (% / pp / etc).
 *   - tone propio que puede ser distinto al tone de la card
 *     (ej: tone primary + delta success al mismo tiempo).
 */

export type MetricTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan';

export interface MetricDelta {
  direction: 'up' | 'down' | 'flat';
  value?: string;
  tone?: MetricTone;
  /** Texto pequeño debajo del delta (ej: "vs mes pasado"). */
  caption?: string;
}

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  /** Texto chico debajo del value (ej: "$ ARS", "% sobre ventas"). */
  unit?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  delta?: MetricDelta;
  /** Doc-code técnico al pie (ej: "OCT-FIN-KPI-001"). */
  docCode?: string;
  /** Padding chico para grids densos. */
  size?: 'sm' | 'md' | 'lg';
  /** "elevated" usa bg-elevated; "surface" usa bg-surface (default). */
  variant?: 'surface' | 'elevated' | 'glass';
  className?: string;
  children?: React.ReactNode;
}

const toneColor: Record<MetricTone, string> = {
  neutral: 'var(--text-secondary)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  cyan: 'var(--color-cyan)',
};

const padding: Record<NonNullable<MetricCardProps['size']>, string> = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const valueSize: Record<NonNullable<MetricCardProps['size']>, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl md:text-6xl',
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  tone = 'neutral',
  delta,
  docCode,
  size = 'md',
  variant = 'surface',
  className = '',
  children,
}) => {
  const bg =
    variant === 'elevated'
      ? 'var(--bg-elevated)'
      : variant === 'glass'
      ? 'rgba(16, 24, 38, 0.6)'
      : 'var(--bg-surface)';

  const deltaTone = delta?.tone ?? tone;
  const DeltaIcon =
    delta?.direction === 'up'
      ? TrendingUp
      : delta?.direction === 'down'
      ? TrendingDown
      : Minus;

  return (
    <div
      className={`group relative overflow-hidden border border-[var(--border-subtle)] transition-all hover:border-[var(--border-strong)] ${padding[size]} ${className}`}
      style={{ background: bg }}
    >
      {/* HUD corner brackets phosphor */}
      <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      {/* Glow on hover */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: toneColor[tone], filter: 'opacity(0.18)' }}
      />

      {/* Header: label + icon */}
      <div className="relative flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
          {label}
        </span>
        {Icon && (
          <span
            className="flex h-7 w-7 items-center justify-center border border-[var(--border-subtle)]"
            style={{ background: 'var(--bg-surface-soft)', color: toneColor[tone] }}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>

      {/* Value */}
      <div className="relative mt-3 flex items-baseline gap-2">
        <span
          className={`font-mono font-bold tracking-tight text-[var(--text-primary)] ${valueSize[size]}`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            {unit}
          </span>
        )}
      </div>

      {/* Delta */}
      {delta && (
        <div className="relative mt-3 flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-mono font-semibold"
            style={{
              color: toneColor[deltaTone],
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-surface-soft)',
            }}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2.25} />
            {delta.value && <span>{delta.value}</span>}
          </span>
          {delta.caption && (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{delta.caption}</span>
          )}
        </div>
      )}

      {/* Children — para gauges, sparks, mini-charts */}
      {children && <div className="relative mt-5">{children}</div>}

      {/* Doc-code */}
      {docCode && (
        <div className="relative mt-5 flex items-center gap-2 opacity-60">
          <span className="h-px w-6 bg-[var(--border-strong)]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {docCode}
          </span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
