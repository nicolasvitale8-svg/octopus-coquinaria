import React from 'react';

/**
 * StatusBadge — primitivo único para estado / etiqueta / chip · FASE 3 HUD.
 *
 * Reemplaza la version pill rounded por chip cuadrado terminal-aesthetic.
 * Tones mapeados a la nueva paleta phosphor.
 *
 * tones disponibles:
 *   - "neutral"  → off-white / muted (default).
 *   - "primary"  → phosphor green (marca, items destacados).
 *   - "success"  → terminal green (aprobado, OK).
 *   - "warning"  → hazard amber (atención).
 *   - "danger"   → rojo (error, rechazado, vencido).
 *   - "info"     → phosphor (informativo) — alias.
 *   - "cyan"     → phosphor (datos técnicos) — alias.
 *
 * variants:
 *   - "soft"   → fondo translúcido + texto color del tone (default).
 *   - "solid"  → fondo sólido + texto abyss black.
 *   - "outline" → sin fondo, sólo borde + texto.
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
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const toneTokens: Record<StatusTone, { color: string; bg: string; border: string; solidText: string }> = {
  neutral: {
    color: 'var(--text-secondary)',
    bg: 'rgba(230, 232, 229, 0.06)',
    border: 'rgba(230, 232, 229, 0.20)',
    solidText: 'var(--bg-base)',
  },
  primary: {
    color: '#00FF9D',
    bg: 'rgba(0, 255, 157, 0.10)',
    border: 'rgba(0, 255, 157, 0.40)',
    solidText: '#050607',
  },
  success: {
    color: '#00C57D',
    bg: 'rgba(0, 197, 125, 0.12)',
    border: 'rgba(0, 197, 125, 0.45)',
    solidText: '#04211A',
  },
  warning: {
    color: '#FFB12A',
    bg: 'rgba(255, 177, 42, 0.12)',
    border: 'rgba(255, 177, 42, 0.45)',
    solidText: '#3A2402',
  },
  danger: {
    color: '#FF4D4D',
    bg: 'rgba(255, 77, 77, 0.12)',
    border: 'rgba(255, 77, 77, 0.40)',
    solidText: '#3A0808',
  },
  info: {
    color: '#00FF9D',
    bg: 'rgba(0, 255, 157, 0.10)',
    border: 'rgba(0, 255, 157, 0.40)',
    solidText: '#050607',
  },
  cyan: {
    color: '#00FF9D',
    bg: 'rgba(0, 255, 157, 0.10)',
    border: 'rgba(0, 255, 157, 0.40)',
    solidText: '#050607',
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
      className={`inline-flex items-center gap-1.5 border font-mono font-medium uppercase tracking-[0.18em] whitespace-nowrap ${sizeClasses} ${className}`}
      style={style}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: variant === 'solid' ? t.solidText : t.color,
            boxShadow: variant === 'solid' ? undefined : `0 0 6px ${t.color}80`,
          }}
        />
      )}
      {children}
    </span>
  );
};

export default StatusBadge;
