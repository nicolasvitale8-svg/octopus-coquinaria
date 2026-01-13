import React, { useState, useEffect } from 'react';
import { procurementService } from '../services/procurementService';
import { Insumo } from '../types';
import { AlertTriangle, AlertCircle, CheckCircle, ArrowLeft, ShoppingCart, Package, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../finance/utils/calculations';

type InsumoConAlerta = Insumo & { alerta: 'CRITICO' | 'ALERTA' | 'OK'; punto_pedido: number };

export const StockAlerts: React.FC = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState<InsumoConAlerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<'ALL' | 'CRITICO' | 'ALERTA'>('ALL');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await procurementService.getInsumosConAlerta();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = items.filter(i => {
        if (filtro === 'ALL') return i.alerta !== 'OK';
        return i.alerta === filtro;
    });

    const criticalCount = items.filter(i => i.alerta === 'CRITICO').length;
    const alertCount = items.filter(i => i.alerta === 'ALERTA').length;

    const getAlertIcon = (alerta: string) => {
        switch (alerta) {
            case 'CRITICO': return <AlertTriangle className="text-red-500" size={20} />;
            case 'ALERTA': return <AlertCircle className="text-yellow-500" size={20} />;
            default: return <CheckCircle className="text-green-500" size={20} />;
        }
    };

    const getAlertBg = (alerta: string) => {
        switch (alerta) {
            case 'CRITICO': return 'bg-red-900/20 border-red-500/30 hover:border-red-500';
            case 'ALERTA': return 'bg-yellow-900/20 border-yellow-500/30 hover:border-yellow-500';
            default: return 'bg-green-900/20 border-green-500/30';
        }
    };

    const handleGenerarPedido = () => {
        // Obtener IDs de items que necesitan reposición
        const itemsParaPedir = items
            .filter(i => i.alerta === 'CRITICO' || i.alerta === 'ALERTA')
            .map(i => i.id);

        // Navegar a OrderForm con query params
        navigate(`/admin/procurement/new?auto=${itemsParaPedir.join(',')}`);
    };

    if (loading) {
        return (
            <div className="p-8 text-white flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/admin/procurement')}
                    className="flex items-center text-gray-400 hover:text-brand transition-colors mb-4 group"
                >
                    <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Volver al Dashboard
                </button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase font-space flex items-center gap-3">
                            <TrendingDown className="text-red-500" size={32} />
                            Alertas de Stock
                        </h1>
                        <p className="text-fin-muted font-bold uppercase tracking-widest text-xs mt-2 pl-1">
                            Insumos que requieren atención
                        </p>
                    </div>
                    {(criticalCount > 0 || alertCount > 0) && (
                        <button
                            onClick={handleGenerarPedido}
                            className="bg-brand hover:bg-brand-hover text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg shadow-brand/20 hover:shadow-brand/40 transition-all transform hover:-translate-y-1"
                        >
                            <ShoppingCart size={16} />
                            Generar Pedido Sugerido
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-500" size={28} />
                        <div>
                            <div className="text-3xl font-black text-white">{criticalCount}</div>
                            <div className="text-xs text-red-400 uppercase tracking-widest font-bold">Stock Crítico</div>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-500" size={28} />
                        <div>
                            <div className="text-3xl font-black text-white">{alertCount}</div>
                            <div className="text-xs text-yellow-400 uppercase tracking-widest font-bold">En Alerta</div>
                        </div>
                    </div>
                </div>
                <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-500" size={28} />
                        <div>
                            <div className="text-3xl font-black text-white">{items.filter(i => i.alerta === 'OK').length}</div>
                            <div className="text-xs text-green-400 uppercase tracking-widest font-bold">Stock OK</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtro */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFiltro('ALL')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filtro === 'ALL' ? 'bg-brand text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                    Todos los alertas
                </button>
                <button
                    onClick={() => setFiltro('CRITICO')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filtro === 'CRITICO' ? 'bg-red-600 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                    Solo Críticos
                </button>
                <button
                    onClick={() => setFiltro('ALERTA')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${filtro === 'ALERTA' ? 'bg-yellow-600 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                    Solo Alertas
                </button>
            </div>

            {/* Lista de Items */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-20 opacity-50">
                    <Package size={48} className="mx-auto mb-4 text-green-500" />
                    <p className="text-xl font-bold text-green-400">¡Todo en orden!</p>
                    <p className="text-sm text-gray-500">No hay insumos con alertas de stock</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map(item => (
                        <div
                            key={item.id}
                            className={`border rounded-2xl p-5 transition-all ${getAlertBg(item.alerta)}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {getAlertIcon(item.alerta)}
                                    <div>
                                        <div className="font-bold text-white text-lg">{item.nombre}</div>
                                        <div className="text-xs text-gray-400 uppercase">{item.categoria} • {item.unidad_medida}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase">Stock Actual</div>
                                        <div className={`text-2xl font-mono font-bold ${item.alerta === 'CRITICO' ? 'text-red-500' : item.alerta === 'ALERTA' ? 'text-yellow-500' : 'text-white'}`}>
                                            {item.stock_actual || 0}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase">Mínimo</div>
                                        <div className="text-2xl font-mono font-bold text-red-400">{item.stock_min || 0}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase">Pto. Pedido</div>
                                        <div className="text-2xl font-mono font-bold text-yellow-400">{item.punto_pedido.toFixed(1)}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase">Máximo</div>
                                        <div className="text-2xl font-mono font-bold text-green-400">{item.stock_max || 0}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase">Lead Time</div>
                                        <div className="text-xl font-mono text-gray-300">{item.lead_time_dias || 0}d</div>
                                    </div>
                                </div>
                            </div>
                            {/* Progress bar visual */}
                            <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${item.alerta === 'CRITICO' ? 'bg-red-500' : item.alerta === 'ALERTA' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, ((item.stock_actual || 0) / (item.stock_max || 1)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
