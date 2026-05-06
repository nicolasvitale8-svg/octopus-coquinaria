import React from 'react';
import { BookOpen, Plus } from 'lucide-react';
import Button from '../ui/Button';

/**
 * AcademyHeader — header de la página /admin/academy · FASE 3 HUD.
 * Tokens phosphor + Button variant primary con contraste correcto.
 */

interface AcademyHeaderProps {
  onNewResource: () => void;
  actions?: React.ReactNode;
}

const AcademyHeader: React.FC<AcademyHeaderProps> = ({ onNewResource, actions }) => {
  return (
    <div
      className="relative flex flex-col md:flex-row justify-between items-start md:items-center p-6 border gap-4"
      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
      <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-1">
          — Academia · CPD-ADM-ACA-001
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={1.75} />
          Academia Cephalopod
        </h1>
        <p className="font-mono text-[11px] text-[var(--text-secondary)] mt-1">
          Biblioteca de recursos educativos para tus clientes.
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {actions}
        <Button onClick={onNewResource} variant="primary" icon={Plus}>
          Nuevo Recurso
        </Button>
      </div>
    </div>
  );
};

export default AcademyHeader;
