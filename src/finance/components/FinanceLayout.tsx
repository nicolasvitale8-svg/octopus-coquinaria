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
    Archive
} from 'lucide-react';
import { useFinanza } from '../context/FinanzaContext';

const FinanceLayout = () => {
    const { activeEntity, alertCount } = useFinanza();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/finance', icon: <PieChart size={20} />, label: 'Resumen' },
        { path: '/finance/budget', icon: <Banknote size={20} />, label: 'Presupuesto' },
        { path: '/finance/transactions', icon: <BarChart3 size={20} />, label: 'Movimientos' },
        { path: '/finance/cheques', icon: <Wallet size={20} />, label: 'Libro Cheques' },
        { path: '/finance/cashflow', icon: <TrendingUp size={20} />, label: 'Cash Flow' },
        { path: '/finance/jars', icon: <PiggyBank size={20} />, label: 'Frascos' },
        { path: '/finance/accounts', icon: <Settings size={20} />, label: 'Administración' },
        { path: '/finance/import', icon: <Download size={20} />, label: 'Importar' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-[#020b14] text-slate-100 font-sans selection:bg-cyan-500/30">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar / Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#050f1a] border-r border-white/5 transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } `}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-white/5 bg-[#050f1a]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex flex-col">
                        <span className="font-black text-xs tracking-[0.3em] text-cyan-400">FINANZAFLOW</span>
                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Octopus System</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-hide">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center px-4 py-3.5 rounded-2xl transition-all group ${isActive(item.path)
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 font-bold translate-x-1'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                } `}
                        >
                            <span className={`mr-3 transition-transform group-hover:scale-110 ${isActive(item.path) ? 'text-white' : 'text-cyan-500/70'} `}>
                                {item.icon}
                            </span>
                            <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 border-t border-white/5 bg-[#050f1a]/80 backdrop-blur-xl">
                    <Link
                        to="/admin"
                        className="flex items-center px-4 py-3 text-white/60 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-sm font-medium group"
                    >
                        <Home size={18} className="mr-3 text-white/40 group-hover:text-cyan-400 transition-colors" />
                        <span>Volver a Octopus</span>
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex w-full items-center px-4 py-3 text-white/60 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all text-sm font-medium group"
                    >
                        <ChevronLeft size={18} className="mr-3 text-white/40 group-hover:text-red-400 transition-colors" />
                        <span>Regresar</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Header Mobile / Navigation Bar */}
                <header className="h-16 bg-[#050f1a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:px-10 z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-slate-400 hover:text-white md:hidden hover:bg-white/5 rounded-xl transition-all"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="hidden md:flex items-center gap-2">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Contexto</span>
                            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {activeEntity.name}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notifications Bell (V2 Phase 1) */}
                        <div className="relative group">
                            <button
                                onClick={() => navigate('/finance/budget')}
                                className={`p-2.5 rounded-xl border transition-all relative ${alertCount > 0 ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'} `}
                            >
                                <Bell size={20} className={alertCount > 0 ? 'animate-swing' : ''} />
                                {alertCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-[#050f1a]">
                                        {alertCount}
                                    </span>
                                )}
                            </button>

                            <div className="absolute top-full mt-2 right-0 hidden group-hover:block z-50">
                                <div className="bg-[#0b1221] border border-white/10 p-3 rounded-xl shadow-2xl whitespace-nowrap">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {alertCount > 0 ? `${alertCount} Pendientes Detectados` : 'Sin notificaciones'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="p-2.5 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-white/5 group shadow-inner"
                            title="Salir al Home"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </header>

                {/* Sub-Header Area with Quick Actions (Optional) */}

                {/* Scrollable Viewport */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#020b14] relative scroll-smooth CustomScrollbar">
                    {/* Background Glows for Aesthetic */}
                    <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

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
                    background: #1e293b;
                    border-radius: 10px;
                }
                .CustomScrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
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
