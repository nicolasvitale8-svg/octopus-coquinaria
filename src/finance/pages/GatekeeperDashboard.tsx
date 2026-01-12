import React, { useState, useEffect } from 'react';
import { ProcurementService, SupplyItem, ProcurementBudget, PurchaseOrderItem } from '../services/procurementService';
import { formatCurrency } from '../utils/calculations';
import { AlertTriangle, Lock, ShieldCheck, ShoppingCart, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const GatekeeperDashboard: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Data State
    const [budget, setBudget] = useState<ProcurementBudget | null>(null);
    const [allItems, setAllItems] = useState<SupplyItem[]>([]);

    // Order State
    const [cartItems, setCartItems] = useState<PurchaseOrderItem[]>([]);
    const [projectedSales, setProjectedSales] = useState<number>(0);
    const [isOverrideMode, setIsOverrideMode] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');

    // Computed State
    const currentTotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const budgetLimit = budget?.limit_amount || 0;
    const isOverBudget = currentTotal > budgetLimit;
    const deviation = currentTotal - budgetLimit;
    const deviationPct = budgetLimit > 0 ? (deviation / budgetLimit) * 100 : 0;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [b, items] = await Promise.all([
                ProcurementService.getActiveBudget(),
                ProcurementService.getItems()
            ]);
            setBudget(b);
            setAllItems(items);
            if (b) setProjectedSales(b.sales_projected);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudget = async () => {
        if (!projectedSales) return;
        try {
            const newBudget = await ProcurementService.createBudget({
                period_start: new Date().toISOString().split('T')[0],
                period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                sales_projected: projectedSales,
                status: 'OPEN'
            });
            setBudget(newBudget);
        } catch (e) {
            alert('Error updating budget');
        }
    };

    const handleAddItem = (itemId: string) => {
        const item = allItems.find(i => i.id === itemId);
        if (!item) return;

        const existing = cartItems.find(i => i.item_id === itemId);
        if (existing) return;

        setCartItems([...cartItems, {
            item_id: item.id,
            quantity: 1,
            unit_price: item.last_price,
            item_name: item.name
        }]);
    };

    const updateQuantity = (index: number, qty: number) => {
        const newCart = [...cartItems];
        newCart[index].quantity = qty;
        setCartItems(newCart);
    };

    const handleCreateOrder = async () => {
        if (isOverBudget && !isOverrideMode) return;

        try {
            await ProcurementService.createOrder({
                budget_id: budget?.id,
                supplier_name: 'Varios', // Simplificado para v1
                status: isOverrideMode ? 'VALIDATED' : 'DRAFT',
                gatekeeper_status: isOverBudget ? 'RED' : 'GREEN',
                total_amount: currentTotal,
                is_forced: isOverrideMode,
                force_reason: overrideReason
            } as any, cartItems);

            alert('Orden generada correctamente');
            setCartItems([]);
            setIsOverrideMode(false);
        } catch (e) {
            console.error(e);
            alert('Error al generar la orden');
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Cargando Gatekeeper...</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header Industrial */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
                        <ShieldCheck className="text-brand" size={32} />
                        El Gatekeeper
                    </h1>
                    <p className="text-fin-muted font-bold uppercase tracking-widest text-xs mt-2">Módulo de Abastecimiento & Control de Costos</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Semana Actual</div>
                    <div className="text-xl font-mono font-bold text-white">
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* SEMÁFORO DE PRESUPUESTO (TOP DASHBOARD) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel 1: Configuración de Objetivo */}
                <div className="bg-[#050f1a] border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={64} />
                    </div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-fin-muted block mb-2">
                        Venta Proyectada (Input Gerencia)
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold">$</span>
                            <input
                                type="number"
                                value={projectedSales || ''}
                                onChange={e => setProjectedSales(Number(e.target.value))}
                                disabled={!!budget}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 pl-8 py-3 text-white font-mono font-bold focus:border-brand outline-none"
                            />
                        </div>
                        {!budget && (
                            <button onClick={handleUpdateBudget} className="bg-brand hover:bg-brand-hover text-black px-4 rounded-xl font-bold uppercase text-xs">
                                Fijar
                            </button>
                        )}
                    </div>

                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
                            <span>Costo Objetivo</span>
                            <span className="text-brand">35%</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-white uppercase tracking-tight">
                            <span>Presupuesto (Techo)</span>
                            <span>{formatCurrency(budgetLimit)}</span>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Semáforo Visual */}
                <div className="col-span-1 lg:col-span-2 bg-[#050f1a] border border-white/10 p-6 rounded-2xl flex flex-col justify-center relative shadow-2xl">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isOverBudget ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                {isOverBudget ? 'ALERTA: PRESUPUESTO EXCEDIDO' : 'ESTADO: HABILITADO'}
                            </span>
                            {isOverBudget && (
                                <p className="text-red-400 text-xs mt-2 font-bold flicker">
                                    DESVÍO DETECTADO: {formatCurrency(Math.abs(deviation))} (+{deviationPct.toFixed(1)}%)
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Gasto Actual</p>
                            <p className={`text-4xl font-black tracking-tighter ${isOverBudget ? 'text-red-500' : 'text-white'}`}>
                                {formatCurrency(currentTotal)}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-6 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                        {/* Target Marker */}
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20 left-[100%]"></div>

                        {/* Green Bar (Safe Zone) */}
                        <div
                            className={`h-full transition-all duration-500 ease-out ${isOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((currentTotal / budgetLimit) * 100, 100)}%` }}
                        >
                            {isOverBudget && <div className="absolute inset-0 bg-[url('/stripe-pattern.png')] opacity-20 animate-slide"></div>}
                        </div>
                    </div>

                    <div className="flex justify-between mt-2 text-[10px] font-black text-fin-muted uppercase tracking-widest">
                        <span>$0</span>
                        <span>Límite: {formatCurrency(budgetLimit)}</span>
                    </div>
                </div>
            </div>

            {/* CARGA OPERATIVA (GRID DE PEDIDOS) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Selector de Ítems (Left) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-2">Catálogo de Insumos</h3>
                    <div className="bg-[#050f1a] border border-white/10 rounded-xl max-h-[500px] overflow-y-auto">
                        {allItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleAddItem(item.id)}
                                className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 flex justify-between items-center group transition-colors"
                            >
                                <div>
                                    <div className="font-bold text-sm text-white group-hover:text-brand">{item.name}</div>
                                    <div className="text-[10px] text-fin-muted uppercase">{item.unit} • {formatCurrency(item.last_price)}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-brand">
                                    <ShoppingCart size={16} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tabla de Carga (Right - Main) */}
                <div className="lg:col-span-3">
                    <div className="bg-[#050f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black/20 text-[10px] uppercase tracking-widest text-fin-muted font-black">
                                    <th className="p-4">Ítem</th>
                                    <th className="p-4 w-32">Prec. Unit</th>
                                    <th className="p-4 w-32">Cantidad</th>
                                    <th className="p-4 w-40 text-right">Subtotal</th>
                                    <th className="p-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm font-bold text-white">
                                {cartItems.map((item, idx) => {
                                    const isPareto = isOverBudget && ((item.quantity * item.unit_price) > (currentTotal * 0.1)); // Simple Pareto Logic (Top 10% drivers)

                                    return (
                                        <tr key={idx} className={`${isPareto ? 'bg-red-500/10' : ''}`}>
                                            <td className="p-4">
                                                {item.item_name}
                                                {isPareto && <span className="ml-2 text-[9px] bg-red-500 text-black px-1 rounded uppercase font-black">Impacto Alto</span>}
                                            </td>
                                            <td className="p-4 text-fin-muted">{formatCurrency(item.unit_price)}</td>
                                            <td className="p-4">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.1"
                                                    value={item.quantity}
                                                    onChange={e => updateQuantity(idx, Number(e.target.value))}
                                                    className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-center focus:border-brand outline-none"
                                                />
                                            </td>
                                            <td className="p-4 text-right font-mono">
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </td>
                                            <td className="p-4">
                                                <button onClick={() => setCartItems(cartItems.filter((_, i) => i !== idx))} className="text-fin-muted hover:text-red-500"><AlertTriangle size={14} /></button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {cartItems.length === 0 && (
                                    <tr><td colSpan={5} className="p-10 text-center text-fin-muted italic text-xs">Carro vacío. Selecciona ítems de la izquierda.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* COMPUERTA LÓGICA (FOOTER ACTIONS) */}
                    <div className="mt-6 flex justify-between items-center bg-[#050f1a] p-6 rounded-2xl border border-white/10">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-fin-muted">Total Orden</p>
                            <p className="text-3xl font-black text-white">{formatCurrency(currentTotal)}</p>
                        </div>

                        <div className="flex gap-4 items-center">
                            {isOverBudget && (
                                <div className="text-right mr-4">
                                    <div className="flex items-center justify-end gap-2 text-red-500 mb-1">
                                        <Lock size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">Bloqueo Activo</span>
                                    </div>
                                    {user?.email?.includes('admin') || user?.email?.includes('nicolasvitale') ? (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" checked={isOverrideMode} onChange={e => setIsOverrideMode(e.target.checked)} className="accent-red-500" />
                                            <span className="text-[10px] font-bold text-white uppercase">Modo Emergencia (Admin)</span>
                                        </label>
                                    ) : (
                                        <span className="text-[10px] text-fin-muted">Contacta al Gerente para autorizar</span>
                                    )}
                                </div>
                            )}

                            <button
                                disabled={(!isOverrideMode && isOverBudget) || cartItems.length === 0 || !budget}
                                onClick={handleCreateOrder}
                                className={`
                  h-14 px-8 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl
                  ${isOverBudget && !isOverrideMode
                                        ? 'bg-fin-bg border border-white/10 text-fin-muted cursor-not-allowed opacity-50'
                                        : isOverrideMode
                                            ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                                            : 'bg-brand hover:bg-brand-hover text-black'
                                    }
                `}
                            >
                                {isOverrideMode ? 'Forzar Orden' : 'Generar Orden'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
