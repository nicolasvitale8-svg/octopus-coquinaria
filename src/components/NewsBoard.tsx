import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { NewsBoardItem, NewsBoardItemType } from '../types';
import { Lightbulb, Tag, Rocket, Radar, ArrowRight, Clock } from 'lucide-react';
import Button from './ui/Button';

const NewsBoard: React.FC = () => {
    const [items, setItems] = useState<NewsBoardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            if (!supabase) return;

            const now = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('public_board_items')
                .select('*')
                .eq('is_visible', true)
                .lte('start_date', now)
                .gte('end_date', now)
                .order('priority', { ascending: true })
                .order('created_at', { ascending: false })
                .limit(6);

            if (data && data.length > 0) {
                setItems(data);
            } else {
                // Fallback Content so the board is always visible to "Catch Clients"
                setItems([
                    {
                        id: 'def-1',
                        title: 'Bienvenido a la Era del Control',
                        summary: 'Octopus reemplaza tus planillas de Excel por un sistema inteligente. Empieza por el Diagnóstico Rápido.',
                        type: 'TIP',
                        is_visible: true,
                        priority: 1,
                        created_at: new Date().toISOString(),
                        start_date: '2020-01-01',
                        end_date: '2030-01-01',
                        cta_label: 'Hacer Diagnóstico',
                        cta_url: '/quick-diagnostic',
                        tag: 'Inicio'
                    },
                    {
                        id: 'def-2',
                        title: 'Academia Gratuita',
                        summary: 'Accede a cursos cortos sobre costos, ingeniería de menú y estandarización de recetas.',
                        type: 'NOVEDAD_APP',
                        is_visible: true,
                        priority: 2,
                        created_at: new Date().toISOString(),
                        start_date: '2020-01-01',
                        end_date: '2030-01-01',
                        cta_label: 'Ir a Academia',
                        cta_url: '/resources',
                        tag: 'Recursos'
                    },
                    {
                        id: 'def-3',
                        title: 'Calendario Gastronómico',
                        summary: 'No te pierdas ningún feriado ni fecha clave comercial. Planifica tu oferta con tiempo.',
                        type: 'RADAR',
                        is_visible: true,
                        priority: 3,
                        created_at: new Date().toISOString(),
                        start_date: '2020-01-01',
                        end_date: '2030-01-01',
                        cta_label: 'Ver Calendario',
                        cta_url: '/calendar',
                        tag: 'Planificación'
                    }
                ]);
            }
            setLoading(false);
        };

        fetchItems();
    }, []);

    const getTypeStyles = (type: NewsBoardItemType) => {
        switch (type) {
            case 'TIP':
                return {
                    icon: <Lightbulb className="w-5 h-5" />,
                    color: 'text-yellow-400',
                    bg: 'bg-yellow-400/10',
                    border: 'border-yellow-400/20',
                    label: 'Tip Operativo'
                };
            case 'DESCUENTO':
                return {
                    icon: <Tag className="w-5 h-5" />,
                    color: 'text-green-400',
                    bg: 'bg-green-400/10',
                    border: 'border-green-400/20',
                    label: 'Descuento / Promo'
                };
            case 'NOVEDAD_APP':
                return {
                    icon: <Rocket className="w-5 h-5" />,
                    color: 'text-[#1FB6D5]',
                    bg: 'bg-[#1FB6D5]/10',
                    border: 'border-[#1FB6D5]/20',
                    label: 'Novedad App'
                };
            case 'RADAR':
                return {
                    icon: <Radar className="w-5 h-5" />,
                    color: 'text-purple-400',
                    bg: 'bg-purple-400/10',
                    border: 'border-purple-400/20',
                    label: 'Radar Sector'
                };
            default:
                return {
                    icon: <Lightbulb className="w-5 h-5" />,
                    color: 'text-slate-400',
                    bg: 'bg-slate-400/10',
                    border: 'border-slate-400/20',
                    label: 'Información'
                };
        }
    };

    if (loading) return null;
    if (items.length === 0) return null;

    return (
        <div className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#1FB6D5]/5 rounded-full blur-[100px] -z-10"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-white font-space mb-2">Pizarra de Novedades</h2>
                        <p className="text-slate-400 max-w-xl">
                            Tips operativos, alertas curadas y novedades para que tu negocio no se detenga.
                        </p>
                    </div>
                    <div className="hidden md:flex items-center text-xs font-bold text-slate-500 uppercase tracking-widest gap-2">
                        <Clock className="w-4 h-4" /> Actualizado semanalmente
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => {
                        const styles = getTypeStyles(item.type);
                        return (
                            <div
                                key={item.id}
                                className={`flex flex-col h-full bg-slate-900/50 backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:border-[#1FB6D5]/40 hover:-translate-y-1 ${styles.border}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.bg} ${styles.color}`}>
                                        {styles.icon}
                                        {styles.label}
                                    </div>
                                    {item.tag && (
                                        <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-800 px-2 py-1 rounded">
                                            #{item.tag}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3 font-space line-clamp-2 leading-tight">
                                    {item.title}
                                </h3>

                                <p className="text-slate-400 text-sm mb-8 flex-grow leading-relaxed">
                                    {item.summary}
                                </p>

                                {item.cta_label && item.cta_url && (
                                    <a href={item.cta_url} target={item.cta_url.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" className="block mt-auto">
                                        <Button variant="outline" size="sm" className="w-full text-xs font-bold group border-slate-700 hover:border-[#1FB6D5] hover:text-[#1FB6D5]">
                                            {item.cta_label}
                                            <ArrowRight className="w-3 h-3 ml-2 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default NewsBoard;
