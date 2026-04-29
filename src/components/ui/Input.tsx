import React from 'react';

/**
 * Input — primitivo de form input · FASE 3 HUD/terminal.
 *
 * Refactor: paleta phosphor, sharp corners, mono uppercase label,
 * focus ring phosphor con glow, placeholder text-muted.
 *
 * Props:
 *   - label (obligatorio): mono uppercase tracking
 *   - prefix (opcional): texto en frame phosphor a la izquierda (ej "$", "+54")
 *   - helperText (opcional): hint mono debajo del input
 *
 * Usado por: Login, ResetPassword, UserProfile, todos los modales,
 * forms de admin, finance, etc. Refactor de este archivo afecta TODA la
 * superficie de formularios del sistema.
 */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({ label, prefix, helperText, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div
            className="absolute inset-y-0 left-0 px-3 flex items-center pointer-events-none border-r"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface-soft)' }}
          >
            <span className="text-[var(--color-primary)] text-sm font-bold font-mono">{prefix}</span>
          </div>
        )}
        <input
          className={`block w-full p-2.5 text-sm transition-colors border focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed ${prefix ? 'pl-12' : ''} ${className}`}
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
          }}
          {...props}
        />
      </div>
      {helperText && (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)] leading-relaxed">
          → {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
