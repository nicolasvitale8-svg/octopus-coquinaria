import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart2, LogOut, User as UserIcon, Database, Briefcase } from 'lucide-react';
import { APP_NAME, INSTAGRAM_URL, DISPLAY_PHONE, CONTACT_EMAIL, YOUTUBE_URL, WHATSAPP_NUMBER, GLOBAL_LOGO_URL, GLOBAL_BACKGROUND_IMAGE_URL, LOGO_ADMIN_URL, LOGO_USER_URL, LOGO_PREMIUM_URL, LOGO_GUEST_URL } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
}

const Layout: React.FC<LayoutProps> = ({ children, user: propUser }) => {
  const { user: contextUser, profile, signOut, isAdmin, isConsultant } = useAuth();
  const [internalUser, setInternalUser] = useState<any>(propUser || contextUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [bgError, setBgError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [dbConnected, setDbConnected] = useState(false);


  useEffect(() => {
    // Check if supabase client is initialized
    setDbConnected(true);

    // Auto-fetch user if not provided (fixes "logged out" header on some pages)
    if (!propUser) {
      // Sync with context (EVEN IF NULL - fixes logout issue)
      setInternalUser(contextUser);
    } else {
      setInternalUser(propUser);
    }
  }, [propUser, contextUser]);

  const navLinks = [
    { name: 'Metodología', path: '/methodology' },
    { name: 'Casos y Servicios', path: '/services' },
    { name: 'Calendario', path: '/calendar' },
    { name: 'Academia', path: '/resources' },
    { name: 'Sobre mí', path: '/about' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path ? 'text-[#1FB6D5] font-bold' : 'text-slate-400 hover:text-white';

  return (
    <div className="min-h-screen bg-[#021019] text-slate-200 flex flex-col font-sans">

      {/* GLOBAL BACKGROUND IMAGE SUPPORT WITH FALLBACK */}
      {GLOBAL_BACKGROUND_IMAGE_URL && !bgError ? (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src={GLOBAL_BACKGROUND_IMAGE_URL}
            alt="Background"
            className="w-full h-full object-cover"
            onError={() => setBgError(true)}
          />
          {/* Heavy overlay to ensure text readability over any image */}
          <div className="absolute inset-0 bg-[#021019]/85 backdrop-blur-[2px]"></div>
        </div>
      ) : (
        /* Default Background */
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00344F] via-[#021019] to-[#021019]"></div>
      )}

      {/* Navbar - Deep Blue */}
      <nav className="sticky top-0 z-50 bg-[#021019]/95 backdrop-blur-sm border-b border-slate-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-3">
                {/* Logo Logic: Role Based */}
                {(() => {
                  let logoToUse = LOGO_GUEST_URL;
                  if (contextUser || internalUser) {
                    const role = profile?.role;
                    if (role === 'admin' || role === 'consultant') logoToUse = LOGO_ADMIN_URL;
                    else if (role === 'client') logoToUse = LOGO_PREMIUM_URL; // Updated 'premium' to 'client'
                    else logoToUse = LOGO_USER_URL;
                  }
                  if (logoError) logoToUse = GLOBAL_LOGO_URL; // Fallback to global if specific fails (or just keep logic simple)

                  return (
                    <img
                      src={logoToUse}
                      alt="Octopus Logo"
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        // Fallback loop prevention
                        const target = e.target as HTMLImageElement;
                        if (target.src !== GLOBAL_LOGO_URL) target.src = GLOBAL_LOGO_URL;
                      }}
                    />
                  );
                })()}

                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-white font-space leading-none uppercase">Octopus</span>
                  <span className="text-[10px] tracking-[0.2em] text-[#1FB6D5] uppercase font-bold">Coquinaria</span>
                </div>
              </Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.path)}`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Right Menu */}
            <div className="hidden md:flex items-center gap-4">
              {/* Admin Shortcut - Only for Admin/Consultant */}
              {(isAdmin || isConsultant) && (
                <Link to="/admin/leads" className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wide border border-slate-700 hover:border-[#1FB6D5] px-3 py-1.5 rounded bg-slate-800/50 hover:bg-slate-800 transition-all">
                  <Database className="w-3 h-3" />
                  Admin DB
                  {dbConnected && (
                    <span className="relative flex h-2 w-2 ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                  )}
                </Link>
              )}

              <div className="flex items-center md:ml-6 gap-4">
                {internalUser ? (
                  <>
                    <Link to="/dashboard" className="flex items-center gap-2 bg-[#00344F] hover:bg-[#1FB6D5]/20 hover:text-[#1FB6D5] border border-[#1FB6D5]/30 px-4 py-2 rounded-md transition-all text-white text-sm font-medium shadow-md">
                      <BarChart2 className="w-4 h-4" />
                      Tablero ({internalUser.email?.split('@')[0]})
                    </Link>
                    <Link
                      to="/hub/profile"
                      className="p-2 text-slate-400 hover:text-[#1FB6D5] hover:bg-slate-800 rounded-full transition-all"
                      title="Mi Perfil"
                    >
                      <UserIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-slate-400 hover:text-white transition-colors"
                      title="Salir"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-slate-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                      Acceder
                    </Link>
                    <Link to="/quick-diagnostic" className="bg-[#1FB6D5] hover:bg-[#159bb8] text-[#021019] px-5 py-2 rounded-md text-sm font-bold shadow-[0_0_15px_rgba(31,182,213,0.4)] transition-all">
                      Diagnóstico Rápido
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
              >
                {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#021019] border-b border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${isActive(link.path)}`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-slate-800 pt-3 mt-3">
                <Link to="/admin/leads" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-400 hover:text-white flex items-center gap-2">
                  <Database className="w-4 h-4" /> Admin DB
                  {dbConnected && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </Link>
                {internalUser ? (
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#1FB6D5] bg-slate-800 mt-2">
                    Ir a mi Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white">
                      Login
                    </Link>
                    <Link to="/quick-diagnostic" onClick={() => setIsMenuOpen(false)} className="block mt-2 w-full text-center px-4 py-3 bg-[#1FB6D5] text-[#021019] rounded-md font-bold">
                      Diagnóstico Rápido
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow relative z-10">
        {children}
      </main>

      {/* Footer - Deep Blue */}
      <footer className="bg-[#010a10] border-t border-slate-900 py-12 mt-auto relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-1">
              <span className="font-bold text-xl text-white flex items-center gap-2 font-space">
                {GLOBAL_LOGO_URL && !logoError ? (
                  <img src={GLOBAL_LOGO_URL} alt="Octopus Logo" className="h-8 w-auto object-contain" onError={() => setLogoError(true)} />
                ) : (
                  <div className="w-6 h-6 bg-[#00344F] rounded-full border border-[#1FB6D5]/30"></div>
                )}
                {APP_NAME}
              </span>
              <p className="mt-4 text-slate-500 text-sm">
                Tentáculos en todo el negocio, cabeza fría en los números.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 font-space">Plataforma</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/quick-diagnostic" className="hover:text-[#1FB6D5] transition-colors">Diagnóstico Madame Oracle</Link></li>
                <li><Link to="/login" className="hover:text-[#1FB6D5] transition-colors">Iniciar Sesión</Link></li>
                <li><Link to="/admin/leads" className="hover:text-[#1FB6D5] transition-colors">Acceso Consultor</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 font-space">Recursos</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/methodology" className="hover:text-[#1FB6D5] transition-colors">Método 7P</Link></li>
                <li><Link to="/resources" className="hover:text-[#1FB6D5] transition-colors">Academia y Videos</Link></li>
                <li><Link to="/services" className="hover:text-[#1FB6D5] transition-colors">Casos de Éxito</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4 font-space">Contacto</h3>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="block text-sm text-slate-500 hover:text-[#1FB6D5] mb-2 transition-colors">
                Whatsapp: {DISPLAY_PHONE}
              </a>
              <a href={`mailto:${CONTACT_EMAIL}`} className="block text-sm text-slate-500 hover:text-[#1FB6D5] mb-2 transition-colors">
                Email: {CONTACT_EMAIL}
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="block text-sm text-slate-500 hover:text-[#1FB6D5] mb-2 transition-colors">
                Instagram: @octopuscuquinaria
              </a>
              <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="block text-sm text-slate-500 hover:text-[#1FB6D5] transition-colors">
                Youtube: @octopuscoquinaria
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Octopus Coquinaria. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
