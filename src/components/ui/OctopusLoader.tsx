import React from 'react';
import OctopusMark from './OctopusMark';

/**
 * OctopusLoader — componente único de loading. Reemplaza:
 *   - "Cargando..." plano sobre fondo negro (Dashboard, AdminUsers).
 *   - "Cargando métricas..." (AdminDashboard).
 *   - "Cargando fichas..." (AdminUsers tabla).
 *   - "Cargando eventos..." (Calendar).
 *   - Spinner cyan circular (Academy).
 *   - <LoadingOverlay /> antiguo.
 *
 * Variants:
 *   - "page"           → fullscreen sobre bg-base, isotipo grande pulsando.
 *                        Para rutas que loadean por primera vez.
 *   - "inline"         → contenedor flexible, ocupa el espacio del padre.
 *                        Para tarjetas, secciones de página parciales.
 *   - "table-skeleton" → 5 filas skeleton con headers parametrizables.
 *                        Para AdminUsers, /dashboard historial, etc.
 *   - "card-skeleton"  → grid de cards skeleton.
 *                        Para Academy, /admin/projects, /finanzaflow.
 *
 * Usar SIEMPRE este componente para cualquier estado de carga visible.
 * Nunca volver a poner texto plano "Cargando..." en pantalla negra.
 */

export type OctopusLoaderVariant = 'page' | 'inline' | 'table-skeleton' | 'card-skeleton';

export interface OctopusLoaderProps {
  variant?: OctopusLoaderVariant;
  text?: string;
  /** sólo para variant="table-skeleton": cantidad de filas */
  rows?: number;
  /** sólo para variant="table-skeleton": cantidad de columnas */
  cols?: number;
  /** sólo para variant="card-skeleton": cantidad de cards */
  cards?: number;
  className?: string;
}

const OctopusLoader: React.FC<OctopusLoaderProps> = ({
  variant = 'inline',
  text,
  rows = 5,
  cols = 4,
  cards = 6,
  className = '',
}) => {
  // ----- variant: page (fullscreen) -----
  if (variant === 'page') {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-base)] ${className}`}
        role="status"
        aria-live="polite"
      >
        <OctopusMark variant="duotone" size={88} animated />
        {text && (
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">
            {text}
          </p>
        )}
        <div className="mt-4 h-[2px] w-48 overflow-hidden rounded-full bg-[var(--bg-surface)]">
          <div className="h-full w-1/3 origin-left animate-progress bg-[var(--color-primary)]" />
        </div>
      </div>
    );
  }

  // ----- variant: inline (contenedor del padre) -----
  if (variant === 'inline') {
    return (
      <div
        className={`flex w-full flex-col items-center justify-center py-12 ${className}`}
        role="status"
        aria-live="polite"
      >
        <OctopusMark variant="duotone" size={48} animated />
        {text && (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {text}
          </p>
        )}
      </div>
    );
  }

  // ----- variant: table-skeleton -----
  if (variant === 'table-skeleton') {
    return (
      <div className={`w-full overflow-hidden rounded-lg border border-[var(--border-subtle)] ${className}`} role="status" aria-live="polite">
        <div className="grid border-b border-[var(--border-subtle)] bg-[var(--bg-surface-soft)] px-4 py-3"
             style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '12px' }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="skeleton h-3 w-3/4" />
          ))}
        </div>
        <div className="divide-y divide-[var(--border-subtle)]">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r}
                 className="grid bg-[var(--bg-surface)] px-4 py-3"
                 style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: '12px' }}>
              {Array.from({ length: cols }).map((_, c) => (
                <div key={c} className="skeleton h-3" style={{ width: `${60 + ((r + c) % 3) * 15}%` }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----- variant: card-skeleton -----
  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5"
        >
          <div className="skeleton mb-3 h-4 w-1/2" />
          <div className="skeleton mb-2 h-3 w-full" />
          <div className="skeleton mb-4 h-3 w-5/6" />
          <div className="flex items-center gap-2">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default OctopusLoader;
