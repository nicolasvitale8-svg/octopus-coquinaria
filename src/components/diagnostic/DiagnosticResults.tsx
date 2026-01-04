import React from 'react';
import { Link } from 'react-router-dom';
import { QuickDiagnosticResult, DiagnosticStatus } from '../../types';
import { WHATSAPP_NUMBER } from '../../constants';
import { formatPercent } from '../../services/calculations';
import Button from '../ui/Button';
import { CheckCircle, AlertTriangle, XCircle, Download, Save, MessageCircle, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DiagnosticResultsProps {
    result: QuickDiagnosticResult;
    formData: {
        contactName: string;
        businessName: string;
        contactEmail: string;
        contactPhone: string;
        password?: string;
    };
}

const DiagnosticResults: React.FC<DiagnosticResultsProps> = ({ result, formData }) => {
    const hasAccount = formData.password && formData.password.length >= 6;

    const getStatusColor = (status: DiagnosticStatus) => {
        switch (status) {
            case DiagnosticStatus.RED: return 'text-[#D64747] border-[#D64747] bg-[#D64747]/10';
            case DiagnosticStatus.YELLOW: return 'text-[#F2B350] border-[#F2B350] bg-[#F2B350]/10';
            case DiagnosticStatus.GREEN: return 'text-[#1FA77A] border-[#1FA77A] bg-[#1FA77A]/10';
            default: return 'text-slate-400';
        }
    };

    const getMetricColor = (val: number, type: 'cogs' | 'labor' | 'margin') => {
        if (type === 'cogs') return val <= 35 ? 'text-[#1FA77A]' : (val <= 40 ? 'text-[#F2B350]' : 'text-[#D64747]');
        if (type === 'labor') return val <= 25 ? 'text-[#1FA77A]' : (val <= 30 ? 'text-[#F2B350]' : 'text-[#D64747]');
        if (type === 'margin') return val >= 15 ? 'text-[#1FA77A]' : (val >= 5 ? 'text-[#F2B350]' : 'text-[#D64747]');
        return 'text-slate-200';
    };

    const getWhatsappLink = () => {
        const message = `Hola Octopus 🐙. Soy ${formData.contactName} de ${formData.businessName}.\n\n` +
            `Acabo de hacer el diagnóstico express:\n` +
            `📊 *Resultado:* ${result.status}\n` +
            `🏷️ *Perfil:* ${result.profileName}\n` +
            `📉 *Costos:* CMV ${result.cogsPercentage.toFixed(1)}% | Mano de Obra ${result.laborPercentage.toFixed(1)}%\n\n` +
            `Me gustaría revisar esto con un consultor.`;
        return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    };

    // Charts Config
    const pieData = [
        { name: 'Mercadería', value: result.cogsPercentage, color: '#1FB6D5' }, // Cyan
        { name: 'Mano de Obra', value: result.laborPercentage, color: '#F2B350' }, // Yellow
        { name: 'Fijos/Alq', value: result.fixedPercentage, color: '#64748b' }, // Grey
        { name: 'Margen', value: Math.max(0, result.marginPercentage), color: '#1FA77A' } // Green
    ].filter(i => i.value > 0);

    const barData = [
        { name: 'Mercadería', Real: result.cogsPercentage, Ideal: 32 },
        { name: 'Mano de Obra', Real: result.laborPercentage, Ideal: 25 },
        { name: 'Fijos', Real: result.fixedPercentage, Ideal: 20 },
        { name: 'Margen', Real: result.marginPercentage, Ideal: 23 },
    ];

    return (
        <div className="animate-fade-in space-y-10">

            {/* Block 1: Status General */}
            <div className="text-center">
                <div className={`inline-flex items-center justify-center px-6 py-2 rounded-full border-2 text-xl font-bold mb-6 ${getStatusColor(result.status)}`}>
                    {result.status === DiagnosticStatus.RED && <XCircle className="w-6 h-6 mr-3" />}
                    {result.status === DiagnosticStatus.YELLOW && <AlertTriangle className="w-6 h-6 mr-3" />}
                    {result.status === DiagnosticStatus.GREEN && <CheckCircle className="w-6 h-6 mr-3" />}
                    Estado General: {result.status}
                </div>

                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 font-space">{result.profileName}</h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    {result.profileDescription}
                </p>
            </div>

            {/* Block 2: Visual Graphics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Distribution */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-white font-bold text-center mb-4 font-space">¿A dónde se van tus ventas?</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `${value.toFixed(1)}%`}
                                    contentStyle={{ backgroundColor: '#021019', borderColor: '#334155', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#cbd5e1' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Benchmark */}
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                    <h3 className="text-white font-bold text-center mb-4 font-space">Tus números vs. Ideal</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" stroke="#94a3b8" unit="%" fontFamily="monospace" />
                                <YAxis type="category" dataKey="name" stroke="#cbd5e1" width={80} style={{ fontSize: '12px', fontFamily: 'sans-serif' }} />
                                <Tooltip
                                    formatter={(value: number) => `${value.toFixed(1)}%`}
                                    contentStyle={{ backgroundColor: '#0b1420', borderColor: '#334155', borderRadius: '8px', border: '1px solid #334155' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#cbd5e1' }} />
                                <Bar dataKey="Real" fill="#1FB6D5" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="Ideal" fill="#475569" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Block 3: Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Costo Mercadería</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.cogsPercentage, 'cogs')}`}>{formatPercent(result.cogsPercentage)}</p>
                    <span className="text-xs text-slate-500">Ideal: &lt; 35%</span>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Mano de Obra</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.laborPercentage, 'labor')}`}>{formatPercent(result.laborPercentage)}</p>
                    <span className="text-xs text-slate-500">Ideal: &lt; 25-30%</span>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">Margen Estimado</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.marginPercentage, 'margin')}`}>{formatPercent(result.marginPercentage)}</p>
                    <span className="text-xs text-slate-500">Antes de impuestos</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Block 4: Strengths */}
                <div className="bg-slate-900/50 p-6 rounded-xl border-l-4 border-[#1FA77A]">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center font-space">
                        <Star className="w-5 h-5 text-[#1FA77A] mr-2" fill="currentColor" />
                        Lo que hacés bien
                    </h3>
                    <ul className="space-y-3">
                        {result.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start text-slate-300 text-sm">
                                <CheckCircle className="w-4 h-4 text-[#1FA77A] mr-2 mt-0.5 flex-shrink-0" />
                                {str}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Block 5: Priorities */}
                <div className="bg-slate-900/50 p-6 rounded-xl border-l-4 border-[#D64747]">
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center font-space">
                        <TrendingUp className="w-5 h-5 text-[#D64747] mr-2" />
                        Prioridades Inmediatas
                    </h3>
                    <ul className="space-y-3">
                        {result.priorities.map((prio, idx) => (
                            <li key={idx} className="flex items-start text-slate-300 text-sm">
                                <ArrowRight className="w-4 h-4 text-[#D64747] mr-2 mt-0.5 flex-shrink-0" />
                                {prio}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Block 6: CTA */}
            <div className="flex flex-col gap-4 pt-6">
                <a href={getWhatsappLink()} target="_blank" rel="noreferrer" className="w-full">
                    <Button className="w-full justify-center py-4 text-lg bg-[#1FA77A] hover:bg-[#15805d] shadow-lg shadow-green-900/20 border-0 font-bold">
                        <MessageCircle className="w-5 h-5 mr-2" /> Quiero que revisemos estos números juntos
                    </Button>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="justify-center py-3 border-slate-600 text-slate-200 hover:bg-slate-800"
                        onClick={() => alert(`¡Listo! Te enviaremos el reporte detallado a ${formData.contactEmail} en los próximos minutos.`)}
                    >
                        <Download className="w-5 h-5 mr-2" /> Recibir reporte por Email
                    </Button>

                    {hasAccount ? (
                        <Link to="/dashboard" className="w-full">
                            <Button variant="secondary" className="w-full justify-center py-3 bg-[#1FB6D5] text-[#021019] hover:bg-white border-0 font-bold">
                                <Save className="w-5 h-5 mr-2" /> Ir al Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <div className="bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50 flex items-center justify-center text-center">
                            <p className="text-slate-400 text-xs italic">
                                🐙 <span className="text-[#1FB6D5] font-bold">¡Gracias!</span> Analizaremos tu caso y te contactaremos a <span className="text-white">{formData.contactPhone}</span>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DiagnosticResults;
