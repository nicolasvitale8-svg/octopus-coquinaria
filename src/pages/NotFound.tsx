import React from 'react';
import { Link } from 'react-router-dom';

/** 404 con estética HUD — antes cualquier URL inválida redirigía mudo a la home. */
const NotFound: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: 'var(--bg-base)' }}>
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
                backgroundImage:
                    'linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
            }}
        />
        <span aria-hidden="true" className="absolute top-4 left-4 w-5 h-5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute top-4 right-4 w-5 h-5 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-4 left-4 w-5 h-5 border-l border-b" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-4 right-4 w-5 h-5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

        <div className="relative text-center space-y-6 px-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--color-primary)' }}>
                ▸ CPD-ERR-404 · SEÑAL PERDIDA
            </p>
            <h1 className="text-7xl font-extrabold" style={{ color: 'var(--text-strong, #fff)' }}>
                4<span style={{ color: 'var(--color-primary)' }}>0</span>4
            </h1>
            <p className="font-mono text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                El pulpo buscó en sus ocho brazos y esta página no está en ninguno.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                    to="/"
                    className="px-6 py-3 font-bold text-sm"
                    style={{ background: 'var(--color-primary)', color: '#04110a' }}
                >
                    Volver al inicio
                </Link>
                <Link
                    to="/academy"
                    className="px-6 py-3 font-bold text-sm border"
                    style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                    Ir a la Academia
                </Link>
            </div>
        </div>
    </div>
);

export default NotFound;
