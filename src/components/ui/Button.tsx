import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Button — primitivo único de botón, mapeado a tokens del rebrand.
 *
 * Reemplaza al Button.tsx anterior basado en bg-[#00344F]/hover:bg-[#1FB6D5].
 * Una sola fuente de verdad: todas las CTA, acciones de form, toolbar y
 * acciones secundarias deben usar este componente.
 *
 * variants:
 *   - "primary"   → gold filled. CTA principal (Solicitar diagnóstico,
 *                   Guardar, Aprobar, Continuar).
 *   - "secondary" → surface filled con borde sutil. Acciones secundarias
 *                   (Cancelar, Volver, ver más).
 *   - "outline"   → sólo borde gold + texto gold. Acción alternativa
 *                   destacada en hero / sobre cream.
 *   - "ghost"     → sin fondo, texto secundario que vira a primario en
 *                   hover. Acciones de fila/tabla, link-buttons.
 *   - "danger"    → rojo. Eliminar, rechazar, vencidos.
 *
 * sizes: sm / md / lg.
 *
 * Soporta:
 *   - icon (LucideIcon) izquierda o derecha.
 *   - loading (spinner gold + disabled).
 *   - fullWidth (w-full para mobile/forms).
 *   - typesafety completo: extiende ButtonHTMLAttributes.
 */

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-[var(--text-on-gold)] border border-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary-soft)] hover:border-[var(--color-primary-soft)] ' +
    'active:bg-[var(--color-primary-dark)] ' +
    'shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_4px_18px_-6px_var(--glow-primary)]',
  secondary:
    'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] ' +
    'hover:bg-[var(--bg-surface-soft)] hover:border-[var(--border-strong)]',
  outline:
    'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] ' +
    'hover:bg-[var(--color-primary)] hover:text-[var(--text-on-gold)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border border-transparent ' +
    'hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]',
  danger:
    'bg-[var(--color-danger)] text-white border border-[var(--color-danger)] ' +
    'hover:opacity-90 active:opacity-80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const iconSize: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const base =
    'inline-flex items-center justify-center font-medium rounded-md ' +
    'transition-all duration-150 select-none whitespace-nowrap ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className={`${iconSize[size]} animate-spin rounded-full border-2 border-current border-t-transparent`}
        />
      ) : (
        Icon && iconPosition === 'left' && (
          <Icon className={iconSize[size]} strokeWidth={2} aria-hidden="true" />
        )
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={iconSize[size]} strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  );
};

export default Button;
