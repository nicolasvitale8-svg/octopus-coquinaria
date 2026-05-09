import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

/**
 * ToastContext — sistema de toast HUD CEPHALOPOD.
 * Provider en App.tsx. Hook: const { showToast } = useToast();
 * showToast('Mensaje', 'success' | 'error' | 'info', durationMs?);
 */

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback no-op si alguien llama fuera del provider
    return { showToast: () => {} };
  }
  return ctx;
};

const ToastView: React.FC<{ toast: ToastItem; onClose: () => void }> = ({ toast, onClose }) => {
  const colorMap: Record<ToastType, { color: string; Icon: React.ComponentType<any> }> = {
    success: { color: 'var(--color-primary)', Icon: CheckCircle2 },
    error:   { color: 'var(--color-danger)',  Icon: AlertCircle },
    info:    { color: 'var(--text-muted)',    Icon: Info }
  };
  const { color, Icon } = colorMap[toast.type];

  return (
    <div
      className="relative border min-w-[280px] max-w-[420px] shadow-2xl animate-fade-in-up pointer-events-auto"
      style={{ background: 'var(--bg-base)', borderColor: color }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: color }} />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: color }} />

      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} strokeWidth={2} />
        <div className="flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-0.5" style={{ color }}>
            {toast.type === 'success' ? '— OK' : toast.type === 'error' ? '— ERROR' : '— INFO'}
          </div>
          <div className="font-mono text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {toast.message}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success', durationMs = 3500) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  const close = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastView key={t.id} toast={t} onClose={() => close(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
