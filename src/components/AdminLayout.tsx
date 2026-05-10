import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  GraduationCap,
  Settings,
  LogOut,
  Menu,
  Briefcase,
  Megaphone,
  BarChart2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import StatusBadge from './ui/StatusBadge';

/**
 * AdminLayout — sidebar admin · FASE 3 HUD/terminal.
 *
 * Diferencias vs version FASE 2:
 *   - Sharp corners (sin rounded en nav items)
 *   - Active nav: bracket phosphor TL + barra lateral phosphor + bg-surface-soft
 *   - Sidebar header con kicker mono "— Operador" arriba del nombre
 *   - SISTEMA · ONLINE indicator debajo del wordmark
 *   - Doc-code CPD-LAYOUT-ADM-001 + version + uptime al pie
 *   - Mobile header con corner brackets phosphor
 */

const AdminLayout = () => {
  const { signOut, profile, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (!supabase || !isAdmin) return;
    let cancelled = false;
    const load = async () => {
      const { count, error } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'user');
      if (!cancelled && !error && typeof count === 'number') {
        setPendingCount(count);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAdmin]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = React.useMemo(
    () =>
      [
        { path: isAdmin ? '/admin/dashboard' : '/admin/consultant-dashboard', icon: LayoutDashboard, label: 'Dashboard',          code: 'DSH' },
        { path: '/admin/leads',        icon: Users,        label: 'CRM Leads',           hidden: !isAdmin, code: 'CRM' },
        { path: '/admin/projects',     icon: Briefcase,    label: 'Hub Proyectos',                          code: 'PRJ' },
        { path: '/admin/users',        icon: Users,        label: 'Usuarios y Roles',    hidden: !isAdmin, badge: pendingCount, code: 'USR' },
        { path: isAdmin ? '/admin/calendar' : '/hub/calendar', icon: Calendar, label: 'Calendario',         code: 'CAL' },
        { path: '/admin/academy',      icon: GraduationCap,label: 'Academia',                              code: 'ACA' },
        { path: '/admin/board',        icon: Megaphone,    label: 'Pizarra Home',                          code: 'BRD' },
        { path: '/admin/procurement',  icon: ShieldCheck,  label: 'Compras / Gatekeeper',                  code: 'GKP' },
        { path: '/finance',            icon: BarChart2,    label: 'FinanzaFlow',                           code: 'FIN' },
        { path: '/admin/config',       icon: Settings,     label: 'Configuración',       hidden: !isAdmin, code: 'CFG' },
      ].filter((item) => !item.hidden),
    [isAdmin, pendingCount],
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className="flex h-screen font-sans"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.65)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ============================================================
          SIDEBAR · CPD-LAYOUT-ADM-001
         ============================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Wordmark / Profile block */}
        <div className="relative px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Corner bracket TL phosphor */}
          <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />

          <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-1">
            — Operador
          </div>

          <Link
            to="/admin/profile"
            className="block group"
            title={profile?.name || profile?.email}
          >
            <div className="font-display text-base font-bold tracking-tight truncate text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
              {profile?.name
                ? profile.name
                : profile?.email?.split('@')[0] || 'Admin'}
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-primary)] mt-0.5">
              {isAdmin ? 'Cephalopod · Admin' : `Cephalopod · ${profile?.role || 'Invitado'}`}
            </div>
          </Link>

          {/* SISTEMA · ONLINE */}
          <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-base)' }}>
            <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 4px rgba(0,255,157,0.45)' }} />
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
              Sistema · Online
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="px-3 pt-2 pb-3 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
            — Módulos
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)]'
                }`}
                style={
                  active
                    ? { background: 'var(--bg-surface-soft)' }
                    : undefined
                }
              >
                {active && (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-0 bottom-0 w-[2px]"
                      style={{ background: 'var(--color-primary)', boxShadow: '0 0 5px rgba(0,255,157,0.35)' }}
                    />
                    <span aria-hidden="true" className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t" style={{ borderColor: 'var(--color-primary)' }} />
                  </>
                )}
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                <span className="flex-1 truncate">{item.label}</span>
                {'badge' in item && (item as { badge?: number }).badge && (item as { badge?: number }).badge! > 0 ? (
                  <StatusBadge tone="warning" variant="solid" size="sm">
                    {(item as { badge?: number }).badge}
                  </StatusBadge>
                ) : (
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--text-muted)] opacity-60 group-hover:opacity-100">
                    {item.code}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Sistema */}
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-3 pt-1 pb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--text-muted)]">
              — Sistema
            </div>

            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-surface-soft)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              <span>Ver sitio público</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-soft)]"
              style={{ color: 'var(--color-danger)' }}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>

        {/* Doc-code footer */}
        <div
          className="relative px-5 py-3 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Corner bracket BR phosphor */}
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

          <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            <span>CPD-LAYOUT-ADM-001</span>
            <span>v2.0.7</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--text-muted)] mt-1">
            <span>Build · CPD-FASE-3</span>
            <span className="inline-flex items-center gap-1">
              <span
                className="inline-flex h-1 w-1 rounded-full animate-pulse"
                style={{ background: 'var(--color-primary)' }}
                aria-label="Sistema activo"
                title="Conectado a Supabase"
              />
              99.98%
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header (mobile) */}
        <header
          className="relative h-14 flex items-center justify-between px-4 border-b md:hidden"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Corner brackets phosphor */}
          <span aria-hidden="true" className="absolute top-0 left-0 w-2 h-2 border-l border-t" style={{ borderColor: 'var(--color-primary)' }} />
          <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 border-r border-b" style={{ borderColor: 'var(--color-primary)' }} />

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="inline-flex items-center justify-center w-8 h-8 border text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-bold tracking-tight text-[var(--text-primary)]">
              CEPHALOPOD
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-primary)]">
              Admin
            </span>
          </div>
          <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 4px rgba(0,255,157,0.45)' }} />
        </header>

        <main
          className="flex-1 overflow-auto p-4 md:p-8 relative"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
