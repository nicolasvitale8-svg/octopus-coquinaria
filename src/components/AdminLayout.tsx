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
  X,
  Briefcase,
  Megaphone,
  BarChart2,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import OctopusMark from './ui/OctopusMark';
import StatusBadge from './ui/StatusBadge';

/**
 * AdminLayout — sidebar admin del rebrand.
 *
 * Cambios respecto a versión anterior:
 *   - Wordmark: OctopusMark mono gold + nombre del usuario en font-display.
 *     (Se descarta LOGO_ADMIN_URL.)
 *   - Tokens en bg/text/border. Sin slate-* / cyan-[hex] / amber-* hardcoded.
 *   - Active item: bg-surface-soft + text gold + barra lateral gold.
 *   - Badge de pendientes → StatusBadge tone="warning" variant="solid".
 *   - "Forzar sincronización" usa StatusBadge cyan (técnica) + spinner.
 *   - "Ver sitio público" en cyan-tech (link externo conceptual).
 *   - "Cerrar sesión" en danger token.
 *   - Mobile header con OctopusMark.
 *   - Doc-code OCT-LAYOUT-ADM-001 al pie de la sidebar.
 */

const AdminLayout = () => {
  const { signOut, profile, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
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
        { path: isAdmin ? '/admin/dashboard' : '/admin/consultant-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/leads', icon: Users, label: 'CRM Leads', hidden: !isAdmin },
        { path: '/admin/projects', icon: Briefcase, label: 'Hub Proyectos' },
        { path: '/admin/users', icon: Users, label: 'Usuarios y Roles', hidden: !isAdmin, badge: pendingCount },
        { path: isAdmin ? '/admin/calendar' : '/hub/calendar', icon: Calendar, label: 'Calendario' },
        { path: '/admin/academy', icon: GraduationCap, label: 'Academia' },
        { path: '/admin/board', icon: Megaphone, label: 'Pizarra Home' },
        { path: '/admin/procurement', icon: ShieldCheck, label: 'Compras / Gatekeeper' },
        { path: '/finance', icon: BarChart2, label: 'FinanzaFlow' },
        { path: '/admin/config', icon: Settings, label: 'Configuración', hidden: !isAdmin },
      ].filter((item) => !item.hidden),
    [isAdmin, pendingCount],
  );

  const isActive = (path: string) => location.pathname === path;

  const handleSync = async () => {
    if (
      !confirm(
        '¿Forzar sincronización de TODOS los datos (Proyectos, Leads, Calendario, Academia)?\n\nEsto subirá tus cambios locales a la nube.',
      )
    ) {
      return;
    }
    setIsSyncing(true);
    try {
      const { syncLocalProjects } = await import('../services/projectService');
      const { syncLocalLeads } = await import('../services/storage');
      const { syncLocalEvents } = await import('../services/calendarService');
      const { syncLocalResources } = await import('../services/academyService');
      await Promise.all([
        syncLocalProjects(),
        syncLocalLeads(),
        syncLocalEvents(),
        syncLocalResources(),
      ]);
      await new Promise((r) => setTimeout(r, 800));
      alert('Sincronización completada con éxito.');
    } catch (e) {
      console.error('Sync Error', e);
      alert('Hubo un error al sincronizar. Revisá la consola.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      className="flex h-screen font-sans"
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.55)' }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ============================================================
          SIDEBAR
          OCT-LAYOUT-ADM-001
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
        {/* Logo / Profile */}
        <Link
          to="/admin/profile"
          className="flex items-center gap-3 h-16 px-5 border-b group transition-colors"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <OctopusMark variant="mono" size={28} className="text-[var(--color-primary)] group-hover:text-[var(--color-primary-soft)] transition-colors" />
          <div className="flex flex-col leading-tight min-w-0">
            <span
              className="font-display text-sm font-semibold tracking-tight truncate text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors"
              title={profile?.name || profile?.email}
            >
              {profile?.name
                ? profile.name
                : profile?.email?.split('@')[0] || 'Admin'}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
              {isAdmin ? 'Admin' : profile?.role || 'Invitado'}
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  active
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={
                  active
                    ? { background: 'var(--bg-surface-soft)' }
                    : undefined
                }
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                    style={{ background: 'var(--color-primary)' }}
                  />
                )}
                <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.75} />
                <span className="flex-1 truncate">{item.label}</span>
                {'badge' in item && (item as { badge?: number }).badge && (item as { badge?: number }).badge! > 0 ? (
                  <StatusBadge tone="warning" variant="solid" size="sm">
                    {(item as { badge?: number }).badge}
                  </StatusBadge>
                ) : null}
              </Link>
            );
          })}

          {/* Forzar Sync */}
          <div className="pt-3 mt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-[var(--color-cyan)] hover:bg-[var(--bg-surface-soft)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
              <span>{isSyncing ? 'Sincronizando…' : 'Forzar sincronización'}</span>
            </button>
          </div>

          {/* Footer items */}
          <div className="pt-3 mt-3 border-t space-y-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-surface-soft)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
              <span>Ver sitio público</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-[var(--bg-surface-soft)]"
              style={{ color: 'var(--color-danger)' }}
            >
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>

        {/* Doc-code footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            OCT-LAYOUT-ADM-001
          </span>
          <span
            className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--color-success)' }}
            aria-label="Sistema activo"
            title="Conectado a Supabase"
          />
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header (mobile) */}
        <header
          className="h-14 flex items-center justify-between px-4 border-b md:hidden"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <OctopusMark variant="mono" size={20} className="text-[var(--color-primary)]" />
            <span className="font-display text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Octopus · Admin
            </span>
          </div>
          <div className="w-5" />
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
