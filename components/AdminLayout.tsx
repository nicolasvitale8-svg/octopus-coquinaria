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
    X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LOGO_ADMIN_URL } from '../constants';

const AdminLayout = () => {
    const { signOut, profile } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/leads', icon: <Users size={20} />, label: 'CRM Leads' },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Usuarios y Roles' },
        { path: '/admin/calendar', icon: <Calendar size={20} />, label: 'Calendario' },
        { path: '/admin/academy', icon: <GraduationCap size={20} />, label: 'Academia' },
        { path: '/admin/config', icon: <Settings size={20} />, label: 'Configuración' },
    ];

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
                className={`fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    }`}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <img src={LOGO_ADMIN_URL} alt="Admin Logo" className="h-8 w-auto object-contain" />
                        <span className="text-xl font-bold text-white tracking-tight">OCTOPUS</span>
                    </div>
                    <button
                        className="md:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-slate-800/50">
                    <p className="text-xs text-slate-500 uppercase font-bold mb-1">Usuario</p>
                    <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Consultor'}</p>
                    <p className="text-xs text-cyan-500/80">{profile?.role || 'Admin'}</p>
                </div>

                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400'
                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={18} className="mr-3" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header Mobile */}
                <header className="md:hidden flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950">
                    <button
                        className="text-slate-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-slate-200">Panel Consultor</span>
                    <div className="w-6" /> {/* Spacer */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
