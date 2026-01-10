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

            const { data, error } = await supabase
                .from('public_board_items')
                .select('*')
                .eq('is_visible', true)
                .order('priority', { ascending: true })
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) {
                console.error("NewsBoard Supabase Error:", error);
            }
            if (data) {
                setItems(data);
            }
            setLoading(false);
        };

        fetchItems();
    }, []);

    const getTypeStyles = (type: NewsBoardItemType) => {
        switch (type) {
            case 'TIP':
                return {
                    icon: <Lightbulb className="w-6 h-6" />,
                    color: 'text-amber-400',
                    bg: 'bg-amber-400/10',
                    border: 'border-amber-400/20',
                    label: 'Tip Estratégico',
                    accent: 'shadow-amber-400/20'
                };
            case 'DESCUENTO':
                return {
                    icon: <Tag className="w-6 h-6" />,
                    color: 'text-emerald-400',
                    bg: 'bg-emerald-400/10',
                    border: 'border-emerald-400/20',
                    label: 'Oportunidad',
                    accent: 'shadow-emerald-400/20'
                };
            case 'NOVEDAD_APP':
                return {
                    icon: <Rocket className="w-6 h-6" />,
                    color: 'text-[#1FB6D5]',
                    bg: 'bg-[#1FB6D5]/10',
                    border: 'border-[#1FB6D5]/20',
                    label: 'Novedad App',
                    accent: 'shadow-[#1FB6D5]/20'
                };
            case 'RADAR':
                return {
                    icon: <Radar className="w-6 h-6" />,
                    color: 'text-indigo-400',
                    bg: 'bg-indigo-400/10',
                    border: 'border-indigo-400/20',
                    label: 'Radar Octopus',
                    accent: 'shadow-indigo-400/20'
                };
            default:
                return {
                    icon: <Lightbulb className="w-6 h-6" />,
                    color: 'text-slate-400',
                    bg: 'bg-slate-400/10',
                    border: 'border-slate-400/20',
                    label: 'Información',
                    accent: 'shadow-slate-400/20'
                };
        }
    };

    if (loading) return null;
    if (items.length === 0) return null;

    return (
        <section className="py-32 bg-[#020a10] relative overflow-hidden">
            {/* Dark Premium Accents */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1FB6D5]/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10"></div>

            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px w-12 bg-[#1FB6D5]"></div>
                            <span className="text-[#1FB6D5] font-black text-xs uppercase tracking-[0.3em]">Comunicados Octopus</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white font-space mb-6 leading-tight">
                            Pizarra de Novedades <br />
                            <span className="text-slate-500 italic font-light">& Curaduría Semanal</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Información clave para dueños que buscan dominar el caos. Tips, herramientas y alertas exclusivas para tu negocio.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {items.map((item) => {
                        const styles = getTypeStyles(item.type);
                        return (
                            <div
                                key={item.id}
                                className={`group relative flex flex-col h-full bg-[#031521] border-white/5 border rounded-[2.5rem] p-8 transition-all duration-500 hover:bg-[#041d2d] hover:border-[#1FB6D5]/30 hover:-translate-y-2 overflow-hidden shadow-2xl`}
                            >
                                {/* Background Glow on Hover */}
                                <div className={`absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${styles.bg}`}></div>

                                <div className="flex justify-between items-start mb-8">
                                    <div className={`p-4 rounded-2xl ${styles.bg} ${styles.color} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                        {styles.icon}
                                    </div>
                                    {item.tag && (
                                        <div className="bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                                                #{item.tag}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] font-space ${styles.color}`}>
                                        {styles.label}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white font-space leading-tight group-hover:text-[#1FB6D5] transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-400 text-base leading-relaxed line-clamp-4">
                                        {item.summary}
                                    </p>
                                </div>

                                {item.cta_label && item.cta_url && (
                                    <div className="pt-6 border-t border-white/5">
                                        <a
                                            href={item.cta_url}
                                            target={item.cta_url.startsWith('http') ? '_blank' : '_self'}
                                            rel="noreferrer"
                                            className="block"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 rounded-2xl border-white/10 text-white font-bold text-xs uppercase tracking-widest group-hover:border-[#1FB6D5] group-hover:bg-[#1FB6D5] group-hover:text-[#021019] transition-all duration-300"
                                            >
                                                {item.cta_label}
                                                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="mt-20 flex justify-center">
                    <div className="flex items-center gap-6 text-slate-600">
                        <div className="h-px w-24 bg-slate-800/50"></div>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                            <Clock className="w-3 h-3" />
                            Actualizado: Enero 2026
                        </div>
                        <div className="h-px w-24 bg-slate-800/50"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NewsBoard;
