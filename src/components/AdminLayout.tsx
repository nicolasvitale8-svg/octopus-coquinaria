import React, { useState } from 'react';
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
    ShieldCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LOGO_ADMIN_URL } from '../constants';
import { syncLocalProjects } from '../services/projectService';
import { RefreshCw } from 'lucide-react';

const AdminLayout = () => {
    const { signOut, profile, isAdmin, isManager } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        {
            path: isAdmin ? '/admin/dashboard' : '/admin/consultant-dashboard',
            icon: <LayoutDashboard size={20} />,
            label: 'Dashboard'
        },
        { path: '/admin/leads', icon: <Users size={20} />, label: 'CRM Leads', hidden: !isAdmin },
        { path: '/admin/projects', icon: <Briefcase size={20} />, label: 'Hub Proyectos' },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Usuarios y Roles', hidden: !isAdmin },
        {
            path: isAdmin ? '/admin/calendar' : '/hub/calendar',
            icon: <Calendar size={20} />,
            label: 'Calendario'
        },
        { path: '/admin/academy', icon: <GraduationCap size={20} />, label: 'Academia' },
        { path: '/admin/board', icon: <Megaphone size={20} />, label: 'Pizarra Home' },
        { path: '/admin/procurement', icon: <ShieldCheck size={20} className="text-brand" />, label: 'Compras / Gatekeeper' },
        { path: '/finance', icon: <BarChart2 size={20} />, label: 'Módulo Finanzas' },
        { path: '/admin/config', icon: <Settings size={20} />, label: 'Configuración', hidden: !isAdmin },
    ].filter(item => !item.hidden);

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#021019] border-r border-slate-800 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo Area */}
                <Link to="/admin/profile" className="h-16 flex items-center px-6 border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
                    <img src={LOGO_ADMIN_URL} alt="Octopus Admin" className="h-8 w-auto mr-3" />
                    <div className="flex flex-col justify-center">
                        <span className="font-bold text-sm tracking-wide font-space text-white truncate max-w-[140px] group-hover:text-[#1FB6D5] transition-colors" title={profile?.name || profile?.email}>
                            {profile?.name ? profile.name.toUpperCase() : (profile?.email?.split('@')[0].toUpperCase() || 'ADMIN')}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
                            {isAdmin ? 'ADMIN' : (profile?.role || 'INVITADO')}
                        </span>
                    </div>
                </Link>

                {/* Nav Items */}
                <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-[#1FB6D5]/10 text-[#1FB6D5] font-bold'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <button
                            onClick={async () => {
                                if (confirm("¿Forzar sincronización de TODOS los datos (Proyectos, Leads, Calendario, Academia)?\n\nEsto subirá tus cambios locales a la nube.")) {
                                    setIsSyncing(true);
                                    try {
                                        // Dynamic imports
                                        const { syncLocalProjects } = await import('../services/projectService');
                                        const { syncLocalLeads } = await import('../services/storage');
                                        const { syncLocalEvents } = await import('../services/calendarService');
                                        const { syncLocalResources } = await import('../services/academyService');

                                        await Promise.all([
                                            syncLocalProjects(),
                                            syncLocalLeads(),
                                            syncLocalEvents(),
                                            syncLocalResources()
                                        ]);

                                        // Give a small delay so user sees the spinner for at least a sec (UX)
                                        await new Promise(r => setTimeout(r, 1000));

                                        alert("✅ Sincronización completada con éxito.");
                                        setIsSyncing(false); // Enable button again
                                    } catch (e) {
                                        console.error("Sync Error", e);
                                        alert("Hubo un error al sincronizar. Revisa la consola.");
                                        setIsSyncing(false);
                                    }
                                }
                            }}
                            className="flex w-full items-center px-4 py-3 text-[#1FB6D5] hover:bg-[#1FB6D5]/10 rounded-lg transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSyncing}
                        >
                            <RefreshCw size={20} className={`mr-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}</span>
                        </button>
                    </div>

                    <div className="pt-8 mt-8 border-t border-slate-800 space-y-2">
                        <Link
                            to="/"
                            className="flex w-full items-center px-4 py-3 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors font-bold"
                        >
                            <LayoutDashboard size={20} className="mr-3" />
                            <span>Ver Sitio Público</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center px-4 py-3 text-red-400 hover:bg-red-900/10 hover:text-red-300 rounded-lg transition-colors"
                        >
                            <LogOut size={20} className="mr-3" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header Mobile */}
                <header className="h-16 bg-[#021019] border-b border-slate-800 flex items-center justify-between px-4 md:hidden">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-slate-400 hover:text-white"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    <span className="font-bold text-white">Octopus Admin</span>
                    <div className="w-6" /> {/* Spacer */}
                </header>

                <main className="flex-1 overflow-auto bg-[#0b1120] p-4 md:p-8 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
