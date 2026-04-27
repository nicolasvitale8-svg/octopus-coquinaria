import React from 'react';

/**
 * StatusBadge — primitivo único para estado / etiqueta / chip.
 *
 * Reemplaza cualquier `<span class="bg-green-... text-green-...">` ad-hoc
 * disperso por la app. Una sola fuente de verdad para los colores de estado.
 *
 * tones disponibles:
 *   - "neutral"  → cream / muted (default).
 *   - "primary"  → gold (marca, items destacados).
 *   - "success"  → verde (aprobado, completado, OK).
 *   - "warning"  → amarillo (atención, vencimientos próximos).
 *   - "danger"   → rojo (error, rechazado, vencido).
 *   - "info"     → violeta (informativo, notas).
 *   - "cyan"     → cyan-tech (datos técnicos, doc-codes, módulos).
 *
 * variants:
 *   - "soft"  → fondo translúcido + texto color del tone (default).
 *   - "solid" → fondo color sólido + texto contraste.
 *   - "outline" → sin fondo, sólo borde + texto.
 *
 * Uso típico:
 *   <StatusBadge tone="success">Aprobado</StatusBadge>
 *   <StatusBadge tone="warning" dot>Pendiente</StatusBadge>
 *   <StatusBadge tone="cyan" variant="outline">OCT-FIN-DOC-001</StatusBadge>
 */

export type StatusTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'cyan';

export type StatusVariant = 'soft' | 'solid' | 'outline';

export interface StatusBadgeProps {
  tone?: StatusTone;
  variant?: StatusVariant;
  /** Punto coloreado a la izquierda (estados live). */
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const toneTokens: Record<StatusTone, { color: string; bg: string; border: string; solidText: string }> = {
  neutral: {
    color: 'var(--text-secondary)',
    bg: 'rgba(243, 239, 228, 0.08)',
    border: 'rgba(243, 239, 228, 0.18)',
    solidText: 'var(--bg-base)',
  },
  primary: {
    color: 'var(--color-primary)',
    bg: 'rgba(212, 182, 129, 0.10)',
    border: 'rgba(212, 182, 129, 0.38)',
    solidText: 'var(--text-on-gold)',
  },
  success: {
    color: '#4ADE80',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.40)',
    solidText: '#062711',
  },
  warning: {
    color: '#FACC15',
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.40)',
    solidText: '#3A2A02',
  },
  danger: {
    color: '#F87171',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.40)',
    solidText: '#3A0808',
  },
  info: {
    color: '#A78BFA',
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.40)',
    solidText: '#1A0F3A',
  },
  cyan: {
    color: '#5DD3E8',
    bg: 'rgba(31, 182, 213, 0.12)',
    border: 'rgba(31, 182, 213, 0.40)',
    solidText: '#06222A',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  size = 'md',
  className = '',
  children,
}) => {
  const t = toneTokens[tone];

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : 'px-2.5 py-1 text-xs';

  let style: React.CSSProperties;
  if (variant === 'solid') {
    style = {
      backgroundColor: t.color,
      color: t.solidText,
      borderColor: t.color,
    };
  } else if (variant === 'outline') {
    style = {
      backgroundColor: 'transparent',
      color: t.color,
      borderColor: t.border,
    };
  } else {
    style = {
      backgroundColor: t.bg,
      color: t.color,
      borderColor: t.border,
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wide whitespace-nowrap ${sizeClasses} ${className}`}
      style={style}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: variant === 'solid' ? t.solidText : t.color }}
        />
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
