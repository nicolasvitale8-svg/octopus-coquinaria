import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowLeft,
    X,
    Home,
    BarChart3,
    Wallet,
    Download,
    Settings,
    Menu,
    ChevronLeft,
    PieChart,
    Banknote,
    Bell,
    PiggyBank,
    TrendingUp,
    ShieldCheck,
    Archive,
    Receipt
} from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';

const FinanceLayout = () => {
    const { activeEntity, alertCount } = useFinanza();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/finance', icon: <PieChart size={20} />, label: 'Resumen' },
        { path: '/finance/annual', icon: <BarChart3 size={20} />, label: 'Vista Anual' },
        { path: '/finance/budget', icon: <Banknote size={20} />, label: 'Presupuesto' },
        { path: '/finance/transactions', icon: <BarChart3 size={20} />, label: 'Movimientos' },
        { path: '/finance/cheques', icon: <Wallet size={20} />, label: 'Libro Cheques' },
        { path: '/finance/loans', icon: <Receipt size={20} />, label: 'Préstamos' },
        { path: '/finance/cashflow', icon: <TrendingUp size={20} />, label: 'Cash Flow' },
        { path: '/finance/jars', icon: <PiggyBank size={20} />, label: 'Frascos' },
        { path: '/finance/accounts', icon: <Settings size={20} />, label: 'Administración' },
        { path: '/finance/import', icon: <Download size={20} />, label: 'Importar' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans selection:bg-[rgba(0,255,157,0.30)]">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar / Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } `}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex flex-col">
                        <span className="font-black text-xs tracking-[0.3em] text-[var(--color-primary)]">FINANZAFLOW</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Octopus System</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3.5 rounded-md transition-all group ${isActive(item.path)
                                ? 'bg-[var(--color-primary)] text-[#050607] shadow-lg shadow-[rgba(0,255,157,0.30)] font-bold translate-x-1'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-soft)] hover:text-[var(--text-primary)]'
                                } `}
                        >
                            <span className={`mr-3 transition-transform group-hover:scale-110 ${isActive(item.path) ? 'text-[var(--text-primary)]' : 'text-[var(--color-primary-soft)]'} `}>
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 backdrop-blur-xl">
                    <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-[var(--text-primary)]/60 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-soft)] rounded-md transition-all text-sm font-medium group"
                    >
                        <Home size={18} className="mr-3 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                        <span>Volver a Octopus</span>
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex w-full items-center px-4 py-3 text-[var(--text-primary)]/60 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5 rounded-md transition-all text-sm font-medium group"
                    >
                        <ChevronLeft size={18} className="mr-3 text-[var(--text-muted)] group-hover:text-[var(--color-danger)] transition-colors" />
                        <span>Regresar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header Mobile / Navigation Bar */}
                <header className="h-16 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)] flex items-center justify-between px-6 md:px-10 z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] md:hidden hover:bg-[var(--bg-surface-soft)] rounded-md transition-all"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-black text-[var(--text-primary)]/20 uppercase tracking-[0.2em]">Contexto</span>
                            <div className="px-3 py-1 bg-[var(--color-primary)]/10 border border-[rgba(0,255,157,0.40)] text-[var(--color-primary)] rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {activeEntity.name}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications Bell (V2 Phase 1) */}
                        <div className="relative group">
                            <button
                                onClick={() => navigate('/finance/budget')}
                                className={`p-2.5 rounded-md border transition-all relative ${alertCount > 0 ? 'bg-[var(--color-danger)]/10 border-[rgba(255,77,77,0.40)] text-[var(--color-danger)] shadow-[0_0_15px_rgba(255,77,77,0.30)]' : 'bg-[var(--bg-surface-soft)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'} `}
                            >
                                <Bell size={20} className={alertCount > 0 ? 'animate-swing' : ''} />
                                {alertCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-danger)] text-[var(--text-primary)] text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-surface)]">
                                        {alertCount}
                                    </span>
                                )}
                            </button>

                            <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50">
                                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 rounded-md shadow-2xl whitespace-nowrap">
                                    <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                                        {alertCount > 0 ? `${alertCount} Pendientes Detectados` : 'Sin notificaciones'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 bg-[var(--bg-surface-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 rounded-md transition-all border border-[var(--border-subtle)] group shadow-inner"
                            title="Salir al Home"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </header>

                {/* Sub-Header Area with Quick Actions (Optional) */}

                {/* Scrollable Viewport */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-base)] relative scroll-smooth CustomScrollbar">
                    {/* Background Glows for Aesthetic */}
                    <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)]/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[rgba(0,255,157,0.05)] rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="max-w-[1400px] mx-auto p-6 md:p-10 relative z-10 animate-fade-in">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Injected Styles for the Layout */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .CustomScrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .CustomScrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .CustomScrollbar::-webkit-scrollbar-thumb {
                    background: #0F1416;
                    border-radius: 10px;
                }
                .CustomScrollbar::-webkit-scrollbar-thumb:hover {
                    background: #1A2025;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                }
                @keyframes swing {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(10deg); }
                    20% { transform: rotate(-10deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-5deg); }
                    50% { transform: rotate(5deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-swing {
                    animation: swing 2s ease infinite;
                    transform-origin: top center;
                }
                `
            }} />
        </div>
    );
};

export default FinanceLayout;
