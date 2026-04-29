import React from 'react';
import { Link } from 'react-router-dom';
import { QuickDiagnosticResult, DiagnosticStatus } from '../../types';
import { WHATSAPP_NUMBER } from '../../constants';
import { formatPercent } from '../../services/calculations';
import Button from '../ui/Button';
import { CheckCircle, AlertTriangle, XCircle, Download, Save, MessageCircle, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface DiagnosticResultsProps {
    result: QuickDiagnosticResult;
    formData: {
        contactName: string;
        businessName: string;
        contactEmail: string;
        contactPhone: string;
        methodologyScores: Record<string, number>;
        password?: string;
    };
}

const DiagnosticResults: React.FC<DiagnosticResultsProps> = ({ result, formData }) => {
    const hasAccount = formData.password && formData.password.length >= 6;

    const getStatusColor = (status: DiagnosticStatus) => {
        switch (status) {
            case DiagnosticStatus.RED: return 'text-[#D64747] border-[#D64747] bg-[#D64747]/10';
            case DiagnosticStatus.YELLOW: return 'text-[#FFB12A] border-[#FFB12A] bg-[#FFB12A]/10';
            case DiagnosticStatus.GREEN: return 'text-[#00C57D] border-[#00C57D] bg-[#00C57D]/10';
            default: return 'text-[var(--text-muted)]';
        }
    };

    const getMetricColor = (val: number, type: 'cogs' | 'labor' | 'margin') => {
        if (type === 'cogs') return val <= 35 ? 'text-[#00C57D]' : (val <= 40 ? 'text-[#FFB12A]' : 'text-[#D64747]');
        if (type === 'labor') return val <= 25 ? 'text-[#00C57D]' : (val <= 30 ? 'text-[#FFB12A]' : 'text-[#D64747]');
        if (type === 'margin') return val >= 15 ? 'text-[#00C57D]' : (val >= 5 ? 'text-[#FFB12A]' : 'text-[#D64747]');
        return 'text-[var(--text-secondary)]';
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
        { name: 'Mercadería', value: result.cogsPercentage, color: 'var(--color-primary)' }, // Cyan
        { name: 'Mano de Obra', value: result.laborPercentage, color: '#FFB12A' }, // Yellow
        { name: 'Fijos/Alq', value: result.fixedPercentage, color: '#64748b' }, // Grey
        { name: 'Margen', value: Math.max(0, result.marginPercentage), color: '#00C57D' } // Green
    ].filter(i => i.value > 0);

    const barData = [
        { name: 'Mercadería', Real: result.cogsPercentage, Ideal: 32 },
        { name: 'Mano de Obra', Real: result.laborPercentage, Ideal: 25 },
        { name: 'Fijos', Real: result.fixedPercentage, Ideal: 20 },
        { name: 'Margen', Real: result.marginPercentage, Ideal: 23 },
    ];

    // Radar Data for 7 Pillars (Scaled from 1-5 to 1-10)
    const radarData = [
        { subject: 'Orden', A: (formData.methodologyScores['O'] || 0) * 2, fullMark: 10 },
        { subject: 'Creatividad', A: (formData.methodologyScores['C'] || 0) * 2, fullMark: 10 },
        { subject: 'Tecnología', A: (formData.methodologyScores['T'] || 0) * 2, fullMark: 10 },
        { subject: 'Observación', A: (formData.methodologyScores['O_obs'] || 0) * 2, fullMark: 10 },
        { subject: 'Pragmatismo', A: (formData.methodologyScores['P'] || 0) * 2, fullMark: 10 },
        { subject: 'Universalidad', A: (formData.methodologyScores['U'] || 0) * 2, fullMark: 10 },
        { subject: 'Sutileza', A: (formData.methodologyScores['S'] || 0) * 2, fullMark: 10 },
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

                <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 font-space">{result.profileName}</h2>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
                    {result.profileDescription}
                </p>
            </div>

            {/* Block 2: Visual Graphics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart 1: Distribution */}
                <div className="bg-[var(--bg-base)] p-6 rounded-md border border-[var(--border-subtle)]">
                    <h3 className="text-[var(--text-primary)] font-bold text-center mb-4 font-space">¿A dónde se van tus ventas?</h3>
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
                                    contentStyle={{ backgroundColor: '#050607', borderColor: '#334155', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontFamily: 'sans-serif', fontSize: '12px', color: '#cbd5e1' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Benchmark */}
                <div className="bg-[var(--bg-base)] p-6 rounded-md border border-[var(--border-subtle)]">
                    <h3 className="text-[var(--text-primary)] font-bold text-center mb-4 font-space">Tus números vs. Ideal</h3>
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
                                <Bar dataKey="Real" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="Ideal" fill="#475569" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Block 2.5: Radar Chart for 7P */}
            <div className="bg-[var(--bg-base)] p-8 rounded-md border border-[var(--border-subtle)] shadow-xl relative overflow-hidden group hover:border-[var(--color-primary)]/30 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl -z-0"></div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] text-center mb-8 font-space">ADN de Gestión: <span className="text-[var(--color-primary)]">Tus 7 Pilares</span></h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                <Radar
                                    name="Puntaje"
                                    dataKey="A"
                                    stroke="var(--color-primary)"
                                    fill="var(--color-primary)"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#050607] p-5 rounded-md border border-[var(--border-subtle)]">
                            <h4 className="text-[var(--color-primary)] font-bold text-sm uppercase mb-2 flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" /> Lectura del ADN
                            </h4>
                            <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                                Este gráfico muestra el equilibrio de tu negocio. Una "mancha" equilibrada indica un negocio robusto.
                                Las puntas que sobresalen son tus fortalezas, mientras que los hundimientos marcan riesgos operativos inminentes.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {radarData.map(item => (
                                <span key={item.subject} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${item.A >= 7 ? 'bg-[var(--color-success)]/20 text-[var(--color-success)] border border-[rgba(0,197,125,0.30)]' : (item.A >= 4 ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)] border border-yellow-500/30' : 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] border border-[var(--color-danger)]/30')}`}>
                                    {item.subject}: {item.A}/10
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Block 3: Key Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-base)] p-6 rounded-md border border-[var(--border-subtle)] text-center">
                    <p className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-2">Costo Mercadería</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.cogsPercentage, 'cogs')}`}>{formatPercent(result.cogsPercentage)}</p>
                    <span className="text-xs text-[var(--text-muted)]">Ideal: &lt; 35%</span>
                </div>
                <div className="bg-[var(--bg-base)] p-6 rounded-md border border-[var(--border-subtle)] text-center">
                    <p className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-2">Mano de Obra</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.laborPercentage, 'labor')}`}>{formatPercent(result.laborPercentage)}</p>
                    <span className="text-xs text-[var(--text-muted)]">Ideal: &lt; 25-30%</span>
                </div>
                <div className="bg-[var(--bg-base)] p-6 rounded-md border border-[var(--border-subtle)] text-center">
                    <p className="text-[var(--text-muted)] text-xs uppercase font-bold tracking-wider mb-2">Margen Estimado</p>
                    <p className={`text-3xl font-bold mb-2 font-mono ${getMetricColor(result.marginPercentage, 'margin')}`}>{formatPercent(result.marginPercentage)}</p>
                    <span className="text-xs text-[var(--text-muted)]">Antes de impuestos</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Block 4: Strengths */}
                <div className="bg-[var(--bg-base)]/50 p-6 rounded-md border-l-4 border-[#00C57D]">
                    <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4 flex items-center font-space">
                        <Star className="w-5 h-5 text-[#00C57D] mr-2" fill="currentColor" />
                        Lo que hacés bien
                    </h3>
                    <ul className="space-y-3">
                        {result.strengths.map((str, idx) => (
                            <li key={idx} className="flex items-start text-[var(--text-secondary)] text-sm">
                                <CheckCircle className="w-4 h-4 text-[#00C57D] mr-2 mt-0.5 flex-shrink-0" />
                                {str}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Block 5: Priorities */}
                <div className="bg-[var(--bg-base)]/50 p-6 rounded-md border-l-4 border-[#D64747]">
                    <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4 flex items-center font-space">
                        <TrendingUp className="w-5 h-5 text-[#D64747] mr-2" />
                        Prioridades Inmediatas
                    </h3>
                    <ul className="space-y-3">
                        {result.priorities.map((prio, idx) => (
                            <li key={idx} className="flex items-start text-[var(--text-secondary)] text-sm">
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
                    <Button className="w-full justify-center py-4 text-lg bg-[#00C57D] hover:bg-[#15805d] shadow-lg shadow-green-900/20 border-0 font-bold">
                        <MessageCircle className="w-5 h-5 mr-2" /> Quiero que revisemos estos números juntos
                    </Button>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="justify-center py-3 border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
                        onClick={() => alert(`¡Listo! Te enviaremos el reporte detallado a ${formData.contactEmail} en los próximos minutos.`)}
                    >
                        <Download className="w-5 h-5 mr-2" /> Recibir reporte por Email
                    </Button>

                    {hasAccount ? (
                        <Link to="/dashboard" className="w-full">
                            <Button variant="secondary" className="w-full justify-center py-3 bg-[var(--color-primary)] text-[#050607] hover:bg-white border-0 font-bold">
                                <Save className="w-5 h-5 mr-2" /> Ir al Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <div className="bg-[var(--bg-surface)]/50 rounded-md px-4 py-3 border border-[var(--border-subtle)]/50 flex items-center justify-center text-center">
                            <p className="text-[var(--text-muted)] text-xs italic">
                                🐙 <span className="text-[var(--color-primary)] font-bold">¡Gracias!</span> Analizaremos tu caso y te contactaremos a <span className="text-[var(--text-primary)]">{formData.contactPhone}</span>.
                            </p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default DiagnosticResults;
