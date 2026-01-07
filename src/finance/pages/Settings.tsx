
import React, { useRef } from 'react';
import { Download, Upload, Database, AlertCircle, RefreshCcw, Github } from 'lucide-react';

export const SettingsPage: React.FC = () => {

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

      <div className="text-center space-y-6">
        <div className="h-px bg-fin-border w-32 mx-auto"></div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-fin-muted">Versión 2.5.0 Stable</p>
          <div className="flex items-center gap-4 text-fin-muted">
            <a href="#" className="hover:text-white transition-colors"><Github size={18} /></a>
            <span className="text-xs font-bold italic">Hecho con ❤️ para tu libertad financiera</span>
          </div>
        </div>
      </div>
    </div>
  );
};
