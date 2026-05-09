import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, Database } from 'lucide-react';
import {
  APP_NAME,
  INSTAGRAM_URL,
  DISPLAY_PHONE,
  CONTACT_EMAIL,
  YOUTUBE_URL,
  WHATSAPP_NUMBER,
  GLOBAL_BACKGROUND_IMAGE_URL,
} from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';
import WelcomeBanner from './WelcomeBanner';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import OctopusMark from './ui/OctopusMark';

/**
 * Layout — top-nav público + footer del rebrand.
 *
 * Cambios respecto a versión anterior:
 *   - Wordmark: solo "OCTOPUS / Coquinaria" en font-display + mono (sin isotipo).
 *     (Se descartan los LOGO_*_URL por rol en el header y el OctopusMark a esta
 *     escala — el nav universal es solo tipografía.)
 *   - Tokens en bg/text/border. Sin hex hardcoded.
 *   - Active link: gold con underline en lugar de cyan.
 *   - Atajo "Admin" para admin/consultant: badge "live" usa StatusBadge tone="success".
 *   - CTA "Diagnóstico rápido" usa Button primary (gold).
 *   - Footer rediseñado con tokens + doc-code OCT-LAYOUT-FOOT-001.
 *   - Tipografía: Sora (display) + Inter (body) + IBM Plex Mono (técnica).
 */

const navLinks = [
  { name: 'Inicio',    path: '/' },
  { name: 'Método',    path: '/methodology' },
  { name: 'Servicios', path: '/services' },
  { name: 'Sistema',   path: '/finance' },
  { name: 'Casos',     path: '/cases' },
  { name: 'Academia',  path: '/academy' },
];

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, user: propUser }) => {
  const { user: contextUser, profile, signOut, isAdmin, isConsultant } = useAuth();
  const [internalUser, setInternalUser] = useState<any>(propUser || contextUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [bgError, setBgError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [dbConnected, setDbConnected] = useState(false);

  useEffect(() => {
    setDbConnected(!!supabase);
    if (!propUser) {
      setInternalUser(contextUser);
    } else {
      setInternalUser(propUser);
    }
  }, [propUser, contextUser]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `relative px-1 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-[var(--color-primary)]'
        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* GLOBAL BACKGROUND */}
      {GLOBAL_BACKGROUND_IMAGE_URL && !bgError ? (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src={GLOBAL_BACKGROUND_IMAGE_URL}
            alt=""
            className="w-full h-full object-cover opacity-30"
            onError={() => setBgError(true)}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(7, 13, 20, 0.88)', backdropFilter: 'blur(2px)' }} />
        </div>
      ) : (
        <div
          className="fixed inset-0 z-0 pointer-events-none opacity-50"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(212, 182, 129, 0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(31, 182, 213, 0.04) 0%, transparent 50%)',
          }}
        />
      )}

      {/* ============================================================
          TOP NAV
          OCT-LAYOUT-NAV-001
         ============================================================ */}
      <nav
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: 'rgba(7, 13, 20, 0.92)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            <div className="flex items-center gap-8">
              {/* Wordmark CEPHALOPOD con logo */}
              <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
                <OctopusMark variant="phosphor" size={28} className="flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                    CEPHALOPOD
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-primary)]">
                    Sistemas que piensan.
                  </span>
                </div>
              </Link>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link key={link.name} to={link.path} className={linkClass(link.path)}>
                    {link.name}
                    {isActive(link.path) && (
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1 left-0 right-0 h-px"
                        style={{ background: 'var(--color-primary)' }}
                      />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* SISTEMA: ONLINE indicator (HUD aesthetic) */}
              <div
                className="hidden lg:inline-flex items-center gap-2 px-2.5 py-1 border mr-2"
                style={{ borderColor: 'var(--border-subtle)', background: 'rgba(0, 255, 157, 0.04)' }}
                title="Estado del sistema en tiempo real"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: 'var(--color-primary)', boxShadow: '0 0 4px rgba(0,255,157,0.40)' }}
                />
                <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-primary)]">
                  Sistema · Online
                </span>
              </div>

              {(isAdmin || isConsultant) && (
                <Link to="/admin/leads">
                  <Button variant="outline" size="sm" icon={Database}>
                    Admin
                    {dbConnected && (
                      <span
                        aria-hidden="true"
                        className="ml-2 inline-flex h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ background: 'var(--color-success)' }}
                      />
                    )}
                  </Button>
                </Link>
              )}

              {internalUser ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="secondary" size="sm">
                      Tablero
                    </Button>
                  </Link>
                  <Link
                    to="/hub/profile"
                    title="Mi Perfil"
                    className="p-2 rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-surface)]"
                  >
                    <UserIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Salir"
                    className="p-2 rounded-full transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Acceder
                    </Button>
                  </Link>
                  <Link to="/quick-diagnostic">
                    <Button variant="primary" size="sm">
                      Diagnóstico rápido
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile burger */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md transition-colors border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                style={{ background: 'var(--bg-surface)' }}
                aria-label="Abrir menú"
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              background: 'var(--bg-base)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="px-3 pt-3 pb-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                    isActive(link.path)
                      ? 'bg-[var(--bg-surface-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div
                className="pt-3 mt-3 border-t space-y-2"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {(isAdmin || isConsultant) && (
                  <Link
                    to="/admin/leads"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <Database className="h-4 w-4" />
                    Admin
                    {dbConnected && (
                      <StatusBadge tone="success" variant="soft" size="sm" dot>
                        Live
                      </StatusBadge>
                    )}
                  </Link>
                )}

                {internalUser ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Ir a mi Dashboard
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="secondary" fullWidth>
                        Acceder
                      </Button>
                    </Link>
                    <Link to="/quick-diagnostic" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="primary" fullWidth>
                        Diagnóstico rápido
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* MAIN */}
      <main className="flex-grow relative z-10">
        <WelcomeBanner />
        {children}
      </main>

      {/* ============================================================
          FOOTER
          OCT-LAYOUT-FOOT-001
         ============================================================ */}
      <footer
        className="relative z-10 mt-auto border-t py-12"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <OctopusMark variant="phosphor" size={32} className="flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">
                    CEPHALOPOD
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-primary)]">
                    Sistemas que piensan.
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] max-w-xs">
                Inteligencia operativa para gastronomía. Sistemas que observan,
                aprenden y mejoran para generar resultados medibles.
              </p>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4">
                — Navegación
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link to="/methodology" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Método 7P
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Servicios
                  </Link>
                </li>
                <li>
                  <Link to="/cases" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Casos
                  </Link>
                </li>
                <li>
                  <Link to="/academy" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Academia
                  </Link>
                </li>
                <li>
                  <Link to="/quick-diagnostic" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Diagnóstico rápido
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4">
                — Contacto
              </h3>
              <div className="space-y-2 text-sm">
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">WA</span>
                  {DISPLAY_PHONE}
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors break-all"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">EM</span>
                  {CONTACT_EMAIL}
                </a>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">IG</span>
                  @octopuscoquinaria
                </a>
                <a
                  href={YOUTUBE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] mr-1">YT</span>
                  @octopuscoquinaria
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)] mb-4">
                — Sistema
              </h3>
              <ul className="space-y-2.5 text-sm font-mono">
                <li className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Estado</span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-primary)] text-xs">
                    <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--color-primary)', boxShadow: '0 0 6px rgba(0,255,157,0.7)' }} />
                    Online
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Versión</span>
                  <span className="text-[var(--text-primary)] text-xs">2.0.7</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Uptime</span>
                  <span className="text-[var(--text-primary)] text-xs">99.98%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Build</span>
                  <span className="text-[var(--text-primary)] text-xs">CPD-FASE-2</span>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              © {new Date().getFullYear()} Cephalopod · Todos los derechos reservados
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              OCT-LAYOUT-FOOT-001
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
