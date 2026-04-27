import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * EmptyState — primitivo único para estados vacíos.
 *
 * Reemplaza:
 *   - Tabla "Historial de Reportes" en /dashboard sin filas.
 *   - /admin/users vacío.
 *   - /admin/projects sin proyectos asignados.
 *   - /calendar sin eventos.
 *   - /academy sin recursos.
 *   - Cualquier listado/tabla/grid que pueda no tener datos.
 *
 * Reglas:
 *   - Siempre con un icon (lucide-react).
 *   - title es obligatorio: dice qué pasó (no qué hay vacío).
 *   - body es opcional: 1-2 líneas explicando próximo paso.
 *   - cta opcional: 1 botón con la acción más probable.
 */

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  cta?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** "card" usa fondo bg-surface; "bare" sólo el contenido sin caja. */
  variant?: 'card' | 'bare';
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  body,
  cta,
  variant = 'card',
  className = '',
}) => {
  const wrapper =
    variant === 'card'
      ? 'rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-12 px-6'
      : 'py-10';

  const ctaContent = cta && (
    cta.href ? (
      <a
        href={cta.href}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-gold)] transition hover:bg-[var(--color-primary-soft)]"
      >
        {cta.label}
      </a>
    ) : (
      <button
        type="button"
        onClick={cta.onClick}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-gold)] transition hover:bg-[var(--color-primary-soft)]"
      >
        {cta.label}
      </button>
    )
  );

  return (
    <div className={`flex flex-col items-center text-center ${wrapper} ${className}`} role="status">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] text-[var(--color-primary)]">
        <Icon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-base font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h3>
      {body && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
          {body}
        </p>
      )}
      {ctaContent && <div className="mt-5">{ctaContent}</div>}
    </div>
  );
};

export default EmptyState;
