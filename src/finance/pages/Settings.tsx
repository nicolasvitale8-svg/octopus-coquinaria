
import React from 'react';
import { RefreshCcw, Github, Sparkles, Shield, Package, Bug } from 'lucide-react';

const CHANGELOG = [
  {
    version: '2.7.0',
    date: '2026-02-03',
    type: 'feature' as const,
    title: 'Demo Mode & Calendar',
    items: [
      'Modo Demo en sección Finanzas para pruebas seguras',
      'Nuevo tipo de evento "TEMPORADA" en el Calendario',
      'Refactorización total a IFinanceService (Arquitectura)',
      'Limpieza de UI: Botón Finanzas removido de navbar'
    ]
  },
  {
    version: '2.6.0',
    date: '2026-01-13',
    type: 'feature' as const,
    title: 'Logger Service & Auditoría',
    items: [
      'Logger centralizado que silencia logs en producción',
      'Tipo Lead tipado correctamente en TypeScript',
      'Alertas de Stock y Movimientos en Compras',
      'Limpieza de archivos huérfanos del proyecto'
    ]
  },
  {
    version: '2.5.0',
    date: '2026-01-12',
    type: 'feature' as const,
    title: 'Tests & Procurement',
    items: [
      'Configuración de Vitest para testing',
      'Módulo de Compras movido a Admin',
      'Mejoras de UI en contraste y navegación'
    ]
  },
  {
    version: '2.4.0',
    date: '2026-01-10',
    type: 'fix' as const,
    title: 'Finanzas RLS Fix',
    items: [
      'Corrección de políticas RLS en tablas de finanzas',
      'Sidebar de finanzas restaurado',
      'Visibilidad de datos personales arreglada'
    ]
  }
];

export const SettingsPage: React.FC = () => {
  const getTypeIcon = (type: 'feature' | 'fix' | 'security') => {
    switch (type) {
      case 'feature': return <Sparkles className="w-4 h-4" />;
      case 'fix': return <Bug className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: 'feature' | 'fix' | 'security') => {
    switch (type) {
      case 'feature': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'fix': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'security': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-fade-in pb-20">
      <div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Configuración</h1>
        <p className="text-fin-muted mt-2 font-medium">Gestiona tus datos y preferencias del sistema.</p>
      </div>

      <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
        <div className="p-10 space-y-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-brand/10 text-brand rounded-2xl"><RefreshCcw size={24} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Sincronización en la Nube</h3>
              <p className="text-sm text-fin-muted">Tus datos están ahora sincronizados de forma segura con Octopus. No necesitas exportar manualmente.</p>
            </div>
          </div>

          <div className="bg-brand/5 border border-brand/20 p-6 rounded-2xl">
            <p className="text-xs text-brand font-bold uppercase tracking-widest mb-1">Multi-Tenant Activo</p>
            <p className="text-xs text-fin-muted">Tus finanzas personales y las de tus empresas están separadas y protegidas.</p>
          </div>
        </div>
      </div>

      {/* Novedades de Versión */}
      <div className="bg-fin-card rounded-[32px] border border-fin-border overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-fin-border bg-fin-bg/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand/10 text-brand rounded-xl"><Package size={20} /></div>
            <div>
              <h3 className="text-lg font-bold text-white">Novedades de la Versión</h3>
              <p className="text-xs text-fin-muted">Últimas actualizaciones y mejoras</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6 max-h-[400px] overflow-y-auto">
          {CHANGELOG.map((release, idx) => (
            <div key={release.version} className={`space-y-3 ${idx !== 0 ? 'pt-6 border-t border-fin-border/50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-white tabular-nums">v{release.version}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeColor(release.type)}`}>
                    {getTypeIcon(release.type)}
                    {release.title}
                  </span>
                </div>
                <span className="text-[10px] text-fin-muted font-mono">{release.date}</span>
              </div>
              <ul className="space-y-1.5 ml-1">
                {release.items.map((item, i) => (
                  <li key={i} className="text-xs text-fin-muted flex items-start gap-2">
                    <span className="text-brand mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center space-y-6">
        <div className="h-px bg-fin-border w-32 mx-auto"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fin-muted">Versión 2.7.0 Stable</p>
          <div className="flex items-center gap-4 text-fin-muted">
            <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
            <span className="text-xs font-bold italic">Hecho con ❤️ para tu libertad financiera</span>
          </div>
        </div>
      </div>
    </div>
  );
};

