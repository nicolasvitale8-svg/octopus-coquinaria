import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, TrendingUp, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * AdminDashboard — panel de control del consultor · FASE 3 HUD.
 * Refactor: tokens phosphor, corner brackets, mono labels, sharp corners.
 */

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalLeads: 0, newLeads: 0, criticalLeads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { count: total } = await supabase
          .from('diagnosticos_express')
          .select('*', { count: 'exact', head: true });
        const { count: recent } = await supabase
          .from('diagnosticos_express')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        const { count: critical } = await supabase
          .from('diagnosticos_express')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Rojo');
        setStats({
          totalLeads: total || 0,
          newLeads: recent || 0,
          criticalLeads: critical || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
        — Cargando métricas…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-2">
          — Panel de Control · CPD-ADM-DSH-001
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Operación en vivo
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/leads"
          className="group relative p-5 border transition-all hover:bg-[var(--bg-surface-soft)]"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center justify-center w-10 h-10 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--color-primary)' }}>
              <Users size={18} strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Total</span>
          </div>
          <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">{stats.totalLeads}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">Diagnósticos realizados</p>
        </Link>

        <div className="relative p-5 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center justify-center w-10 h-10 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--color-success)' }}>
              <TrendingUp size={18} strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">Semana</span>
          </div>
          <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">+{stats.newLeads}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)] mt-1">Nuevos prospectos</p>
        </div>

        <Link
          to="/admin/leads"
          state={{ filterStatus: 'Rojo' }}
          className="group relative p-5 border transition-all hover:bg-[var(--bg-surface-soft)]"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}
        >
          <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-danger)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-danger)' }} />
          <div className="flex items-center justify-between mb-4">
            <span className="flex items-center justify-center w-10 h-10 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--color-danger)' }}>
              <AlertTriangle size={18} strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-danger)]">Acción</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="font-mono text-3xl font-bold text-[var(--text-primary)]">{stats.criticalLeads}</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">críticos</span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-danger)] mt-1">Requieren atención →</p>
        </Link>
      </div>

      {/* Quick Actions + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="relative p-5 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4">— Accesos Rápidos</h2>
          <div className="space-y-2">
            <Link
              to="/admin/leads"
              className="flex items-center justify-between p-3 border transition-colors hover:bg-[var(--bg-surface-soft)] hover:border-[var(--border-strong)] group"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Ver base de datos completa
              </span>
              <Users size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" strokeWidth={1.75} />
            </Link>
            <Link
              to="/admin/calendar"
              className="flex items-center justify-between p-3 border transition-colors hover:bg-[var(--bg-surface-soft)] hover:border-[var(--border-strong)] group"
              style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Gestionar eventos del calendario
              </span>
              <Calendar size={16} className="text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="relative p-5 border flex flex-col items-center justify-center text-center" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <span aria-hidden="true" className="absolute top-0 left-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4">— Estado del Sistema</span>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 5px rgba(0,255,157,0.40)' }} />
            <CheckCircle size={16} className="text-[var(--color-primary)]" strokeWidth={1.75} />
            <span className="font-mono text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">
              Operativo
            </span>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            v2.0.7 · Módulo Consultor Activo
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
