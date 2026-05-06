import React from 'react';
import { Calendar, Wallet, GraduationCap } from 'lucide-react';

/**
 * AdminConfig — pagina de configuracion del sistema (en /admin/config).
 * FASE 3 HUD: emojis OS-render reemplazados por lucide icons phosphor,
 * corner brackets en cards principales, doc-codes mono.
 */

export const AdminConfig = () => (
  <div className="space-y-6">
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2">
        — Configuración del Sistema · CPD-ADM-CFG-001
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        Ajustes globales del sistema
      </h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Versión del Sistema */}
      <div className="relative flex flex-col items-center justify-center p-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center">
        <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2">— Sistema</div>
        <p className="font-display text-3xl md:text-4xl font-bold text-[var(--color-primary)] mb-3" style={{ textShadow: '0 0 12px rgba(0, 255, 157, 0.35)' }}>
          v4.2.0
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
          <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(0,255,157,0.7)' }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
            Motor Cephalopod · Activo
          </span>
        </div>
      </div>

      {/* Novedades */}
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6">
        <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
        <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

        <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4 flex items-center gap-2">
          <span className="bg-[var(--color-primary)] text-[#050607] text-[9px] font-bold px-2 py-0.5">NEW</span>
          — Novedades de la versión
        </h3>

        <div className="space-y-5 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar">
          <div className="space-y-2">
            <h4 className="text-[var(--color-primary)] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
              Calendario Comercial v2.2
            </h4>
            <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 ml-2">
              <li><strong className="text-[var(--text-primary)]">Sincronización total:</strong> corrección de eventos locales y sync automático con Supabase.</li>
              <li><strong className="text-[var(--text-primary)]">UI pública simplificada:</strong> diseño limpio (día + título) con modal de detalle.</li>
              <li><strong className="text-[var(--text-primary)]">Auto-scroll:</strong> enfoque automático en el día actual o próximo evento.</li>
              <li><strong className="text-[var(--text-primary)]">Gestión admin:</strong> edición directa de eventos sin borrar y recrear.</li>
            </ul>
          </div>

          <div className="border-t border-[var(--border-subtle)]" />

          <div className="space-y-2">
            <h4 className="text-[var(--color-success)] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4" strokeWidth={1.75} />
              Finanzas & Dashboard
            </h4>
            <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 ml-2">
              <li><strong className="text-[var(--text-primary)]">Presupuestos:</strong> corrección en carga y visualización de Enero/Noviembre.</li>
              <li><strong className="text-[var(--text-primary)]">UI mejorada:</strong> tablas con encabezados fijos (sticky) para mejor navegación.</li>
              <li><strong className="text-[var(--text-primary)]">Acceso clientes:</strong> unificación del Hub (ven todas las pestañas relevantes).</li>
              <li><strong className="text-[var(--text-primary)]">Novedades:</strong> tarjetas interactivas en el Dashboard principal.</li>
            </ul>
          </div>

          <div className="border-t border-[var(--border-subtle)]" />

          <div className="space-y-2">
            <h4 className="text-[var(--color-primary)] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4" strokeWidth={1.75} />
              Academia & Sistema
            </h4>
            <ul className="list-disc list-inside text-xs text-[var(--text-secondary)] space-y-1 ml-2">
              <li><strong className="text-[var(--text-primary)]">Recursos:</strong> soporte para múltiples URLs y sección de Impacto.</li>
              <li><strong className="text-[var(--text-primary)]">Infraestructura:</strong> restauración de conexión Supabase y fix de permisos RLS.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);
