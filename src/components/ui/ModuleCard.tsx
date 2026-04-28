import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ModuleCard — primitivo para tiles de "módulo" / "shortcut" del dashboard.
 *
 * Reemplaza:
 *   - Tile "Proyecto 7P" del Dashboard.
 *   - Shortcuts "Calendario" / "Academia".
 *   - Tarjetas de módulo en /admin/dashboard (Usuarios, Proyectos, Métricas).
 *   - Tiles de FinanzaFlow (Costos, Ingeniería de menú, Ingresos).
 *   - Cards de procurement, inventario, etc.
 *
 * Variants:
 *   - "default"  → bordeado, fondo bg-surface, hover gold.
 *   - "feature"  → bordeado gold strong, fondo bg-elevated, para módulo destacado.
 *   - "compact"  → padding chico, sin description, ideal para shortcut grids.
 *
 * Props:
 *   - title (obligatorio)
 *   - description (opcional, se omite en compact)
 *   - icon (LucideIcon)
 *   - href ó onClick (uno de los dos)
 *   - kicker (etiqueta arriba, ej: "Seguimiento", "Productividad")
 *   - status (StatusBadge node opcional, ej: "BETA", "PRO")
 *   - cta (texto del botón, default "Abrir")
 *   - tone (color del icon-badge: neutral/primary/cyan/success/warning/danger)
 *   - docCode (al pie)
 */

export type ModuleTone = 'neutral' | 'primary' | 'cyan' | 'success' | 'warning' | 'danger';

const toneColor: Record<ModuleTone, string> = {
  neutral: 'var(--text-secondary)',
  primary: 'var(--color-primary)',
  cyan: 'var(--color-cyan)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

export interface ModuleCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  kicker?: string;
  status?: React.ReactNode;
  cta?: string;
  tone?: ModuleTone;
  docCode?: string;
  variant?: 'default' | 'feature' | 'compact';
  /** Si es link externo (target=_blank). */
  external?: boolean;
  className?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  kicker,
  status,
  cta = 'Abrir',
  tone = 'primary',
  docCode,
  variant = 'default',
  external = false,
  className = '',
}) => {
  const isCompact = variant === 'compact';
  const isFeature = variant === 'feature';

  const containerClass =
    'group relative flex flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-0.5';

  const padding = isCompact ? 'p-5' : 'p-6';
  const heightHint = isCompact ? '' : 'h-full';

  const styleByVariant: React.CSSProperties = isFeature
    ? {
        background: 'var(--bg-elevated)',
        borderColor: 'var(--border-strong)',
        boxShadow: '0 0 40px rgba(0, 255, 157, 0.10)',
      }
    : {
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      };

  const inner = (
    <>
      {/* HUD corner brackets phosphor */}
      <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      {/* Glow halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: toneColor[tone], filter: 'opacity(0.18)' }}
      />

      {/* Top row: kicker + status */}
      {(kicker || status) && (
        <div className="relative mb-3 flex items-center justify-between gap-2">
          {kicker ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {kicker}
            </span>
          ) : (
            <span />
          )}
          {status}
        </div>
      )}

      {/* Icon badge — square HUD frame */}
      <div
        className={`relative flex items-center justify-center border border-[var(--border-subtle)] transition-transform duration-300 group-hover:scale-105 ${
          isCompact ? 'h-9 w-9' : 'h-11 w-11'
        }`}
        style={{
          background: 'var(--bg-surface-soft)',
          color: toneColor[tone],
          marginBottom: isCompact ? '0.5rem' : '1rem',
        }}
      >
        <Icon className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={1.75} />
      </div>

      {/* Title */}
      <h3
        className={`relative font-display font-semibold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--color-primary)] ${
          isCompact ? 'text-sm' : 'text-lg md:text-xl'
        }`}
      >
        {title}
      </h3>

      {/* Description */}
      {!isCompact && description && (
        <p className="relative mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      )}

      {/* CTA + docCode */}
      {!isCompact && (
        <div className="relative mt-auto flex items-center justify-between pt-5">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: toneColor[tone] }}
          >
            {cta}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </span>
          {docCode && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {docCode}
            </span>
          )}
        </div>
      )}
    </>
  );

  // Link externo
  if (href && external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${containerClass} ${padding} ${heightHint} ${className}`}
        style={styleByVariant}
      >
        {inner}
      </a>
    );
  }

  // Link interno
  if (href) {
    return (
      <Link
        to={href}
        className={`${containerClass} ${padding} ${heightHint} ${className}`}
        style={styleByVariant}
      >
        {inner}
      </Link>
    );
  }

  // Botón
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${containerClass} text-left ${padding} ${heightHint} ${className}`}
      style={styleByVariant}
    >
      {inner}
    </button>
  );
};

export default ModuleCard;
