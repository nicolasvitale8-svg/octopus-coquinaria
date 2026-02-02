import React, { useRef, useState } from 'react';
import {
    X, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2,
    Target, Shield, Zap, DollarSign, FileText, Loader2, ChevronDown, ChevronUp,
    AlertCircle, Clock, Wallet, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AuditReport, HealthStatus, ForecastRank, DeviationItem, CategoryHealth, RiskAlert, RecommendedAction } from '../financeTypes';
import { formatCurrency } from '../utils/calculations';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface AuditReportModalProps {
    report: AuditReport;
    onClose: () => void;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const generateDocCode = (entityName: string, month: number, year: number) => {
    const prefix = entityName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3) || 'OCT';
    return `${prefix}-AUD-${String(month + 1).padStart(2, '0')}-${year}`;
};

// Status badge colors
const getStatusColor = (status: HealthStatus) => {
    switch (status) {
        case 'excellent': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
        case 'good': return 'bg-blue-100 text-blue-700 border-blue-300';
        case 'warning': return 'bg-amber-100 text-amber-700 border-amber-300';
        case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    }
};

const getStatusIcon = (status: HealthStatus) => {
    switch (status) {
        case 'excellent': return <CheckCircle2 size={16} className="text-emerald-600" />;
        case 'good': return <CheckCircle2 size={16} className="text-blue-600" />;
        case 'warning': return <AlertTriangle size={16} className="text-amber-600" />;
        case 'critical': return <AlertCircle size={16} className="text-red-600" />;
    }
};

const getStatusLabel = (status: HealthStatus) => {
    switch (status) {
        case 'excellent': return 'Excelente';
        case 'good': return 'Bueno';
        case 'warning': return 'Atención';
        case 'critical': return 'Crítico';
    }
};

const getForecastLabel = (rank: ForecastRank) => {
    switch (rank) {
        case 'solid': return 'Sólido';
        case 'acceptable': return 'Aceptable';
        case 'fantasy': return 'Fantasía';
    }
};

const getForecastColor = (rank: ForecastRank) => {
    switch (rank) {
        case 'solid': return 'bg-emerald-100 text-emerald-700';
        case 'acceptable': return 'bg-amber-100 text-amber-700';
        case 'fantasy': return 'bg-red-100 text-red-700';
    }
};

const getReasonLabel = (reason: string) => {
    switch (reason) {
        case 'one_off': return '📍 Evento puntual';
        case 'leak': return '💧 Derrame';
        case 'trend': return '📈 Tendencia';
        case 'unbudgeted': return '❓ No presupuestado';
        default: return '❔ Sin patrón claro';
    }
};

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'high': return 'bg-red-50 border-red-200 text-red-700';
        case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
        case 'low': return 'bg-blue-50 border-blue-200 text-blue-700';
        default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
};

const getImpactBadge = (impact: string) => {
    switch (impact) {
        case 'high': return <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded">ALTO</span>;
        case 'medium': return <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded">MEDIO</span>;
        case 'low': return <span className="px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-700 rounded">BAJO</span>;
        default: return null;
    }
};

export const AuditReportModal: React.FC<AuditReportModalProps> = ({ report, onClose }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'deviations', 'health', 'risks', 'actions']));

    const docCode = generateDocCode(report.entityName, report.month, report.year);
    const generatedDate = new Date(report.generatedAt);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setExporting(true);
        try {
            // Expand all sections for export
            setExpandedSections(new Set(['summary', 'deviations', 'health', 'drivers', 'forecast-score', 'risks', 'actions', 'forecast', 'cash']));
            await new Promise(r => setTimeout(r, 300));

            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${docCode}_Auditoria_Financiera.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    const SectionHeader: React.FC<{ id: string; title: string; icon: React.ReactNode; subtitle?: string }> = ({ id, title, icon, subtitle }) => (
        <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg"
        >
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-bold text-gray-800">{title}</span>
                {subtitle && <span className="text-xs text-gray-500">({subtitle})</span>}
            </div>
            {expandedSections.has(id) ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-8 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl relative mb-8">
                {/* Modal Header Controls */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-slate-800 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Shield size={24} className="text-cyan-400" />
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wide">Auditoría Financiera</h2>
                            <p className="text-xs text-slate-400">{MONTH_NAMES[report.month]} {report.year} • {docCode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 text-white text-sm font-bold rounded-lg hover:bg-cyan-400 transition-all disabled:opacity-50"
                        >
                            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {exporting ? 'Generando...' : 'Exportar PDF'}
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div ref={reportRef} className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Header */}
                    <div className="px-8 pt-6 pb-4 border-b-4 border-cyan-500">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <img src="/logo_simple.png" alt="Octopus" className="w-14 h-14 object-contain" />
                                <div>
                                    <div className="text-xl font-black text-gray-800 tracking-wide">FINANZAFLOW</div>
                                    <div className="text-sm text-gray-500">Auditoría Financiera | Documento controlado</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Código: <span className="font-mono font-bold">{docCode}</span></div>
                                <div className="text-xs text-gray-500">Generado: {generatedDate.toLocaleDateString('es-ES')}</div>
                            </div>
                        </div>
                    </div>

                    {/* ============ RESUMEN EJECUTIVO ============ */}
                    <div className="px-8 py-6 space-y-6">
                        <div className="space-y-4">
                            <SectionHeader id="summary" title="Resumen Ejecutivo" icon={<Target size={18} className="text-cyan-600" />} />
                            {expandedSections.has('summary') && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Health Score */}
                                    <div className={`p-4 rounded-xl border-2 ${getStatusColor(report.healthScore)}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusIcon(report.healthScore)}
                                            <span className="text-xs font-bold uppercase">Salud Global</span>
                                        </div>
                                        <div className="text-2xl font-black">{getStatusLabel(report.healthScore)}</div>
                                    </div>
                                    {/* Execution Rate */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Ejecución Presupuestaria</div>
                                        <div className={`text-2xl font-black ${report.executionRate > 110 ? 'text-red-600' : report.executionRate > 100 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {report.executionRate.toFixed(0)}%
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatCurrency(report.totalOut)} / {formatCurrency(report.totalPlanned)}
                                        </div>
                                    </div>
                                    {/* Net Balance */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Balance Neto</div>
                                        <div className={`text-2xl font-black ${report.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(report.netBalance)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Ingresos: {formatCurrency(report.totalIn)}
                                        </div>
                                    </div>
                                    {/* Unbudgeted */}
                                    <div className={`p-4 rounded-xl border ${report.totalUnbudgeted > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">No Presupuestado</div>
                                        <div className={`text-2xl font-black ${report.totalUnbudgeted > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                                            {formatCurrency(report.totalUnbudgeted)}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {((report.totalUnbudgeted / report.totalOut) * 100).toFixed(0)}% del gasto
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============ MOM COMPARISON ============ */}
                        {expandedSections.has('summary') && report.comparison.prevMonth && (
                            <div className="bg-slate-50 rounded-xl p-4">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-3">Comparativo</div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-xs text-gray-500">vs Mes Anterior</div>
                                        <div className={`text-lg font-black ${report.comparison.deltaPrevMonth > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {report.comparison.deltaPrevMonth > 0 ? '+' : ''}{report.comparison.deltaPrevMonth.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">vs Promedio 3M</div>
                                        <div className={`text-lg font-black ${report.comparison.delta3M > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                            {report.comparison.delta3M > 0 ? '+' : ''}{report.comparison.delta3M.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Gastos Previos</div>
                                        <div className="text-lg font-black text-gray-700">
                                            {formatCurrency(report.comparison.prevMonth.totalOut)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============ TOP 5 DESVÍOS ============ */}
                        <div className="space-y-4">
                            <SectionHeader
                                id="deviations"
                                title="Top 5 Desvíos"
                                icon={<TrendingUp size={18} className="text-red-500" />}
                                subtitle={`${report.topExceeded.length} excedidos, ${report.topSaved.length} ahorros`}
                            />
                            {expandedSections.has('deviations') && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Exceeded */}
                                    <div className="border border-red-200 rounded-xl overflow-hidden">
                                        <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                                            <span className="text-sm font-bold text-red-700">🔴 Excedidos</span>
                                        </div>
                                        <div className="divide-y divide-red-100">
                                            {report.topExceeded.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">Sin desvíos negativos 🎉</div>
                                            ) : report.topExceeded.map((item, idx) => (
                                                <div key={idx} className="p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-gray-800">{item.label}</div>
                                                            <div className="text-xs text-gray-500">{item.categoryName}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-red-600 font-bold">+{formatCurrency(item.deviation)}</div>
                                                            <div className="text-xs text-gray-500">+{item.deviationPercent.toFixed(0)}%</div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{getReasonLabel(item.reason)}</span>
                                                        <span className="text-xs text-gray-400">{item.transactionCount} tx</span>
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500 italic">{item.reasonDetail}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Saved */}
                                    <div className="border border-emerald-200 rounded-xl overflow-hidden">
                                        <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200">
                                            <span className="text-sm font-bold text-emerald-700">🟢 Ahorros</span>
                                        </div>
                                        <div className="divide-y divide-emerald-100">
                                            {report.topSaved.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">Sin ahorros significativos</div>
                                            ) : report.topSaved.map((item, idx) => (
                                                <div key={idx} className="p-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-gray-800">{item.label}</div>
                                                            <div className="text-xs text-gray-500">{item.categoryName}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-emerald-600 font-bold">{formatCurrency(item.deviation)}</div>
                                                            <div className="text-xs text-gray-500">{item.deviationPercent.toFixed(0)}%</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============ SEMÁFORO POR CATEGORÍA ============ */}
                        <div className="space-y-4">
                            <SectionHeader
                                id="health"
                                title="Semáforo por Categoría"
                                icon={<Zap size={18} className="text-amber-500" />}
                                subtitle={`${report.categoryHealth.filter(c => c.status === 'critical').length} críticas`}
                            />
                            {expandedSections.has('health') && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 text-gray-700">
                                                <th className="text-left p-3 font-bold">Categoría</th>
                                                <th className="text-right p-3 font-bold">Planificado</th>
                                                <th className="text-right p-3 font-bold">Real</th>
                                                <th className="text-center p-3 font-bold">Estado</th>
                                                <th className="text-right p-3 font-bold">Peso</th>
                                                <th className="text-right p-3 font-bold">vs 3M</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {report.categoryHealth.map((cat, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 font-bold text-gray-900">{cat.categoryName}</td>
                                                    <td className="p-3 text-right text-gray-800">{formatCurrency(cat.planned)}</td>
                                                    <td className="p-3 text-right font-bold text-gray-900">{formatCurrency(cat.actual)}</td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${getStatusColor(cat.status)}`}>
                                                            {getStatusIcon(cat.status)}
                                                            {getStatusLabel(cat.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <span className="text-gray-800 font-medium">{cat.weight.toFixed(0)}%</span>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <span className={cat.trend3M > 20 ? 'text-red-600 font-bold' : cat.trend3M < -10 ? 'text-emerald-600' : 'text-gray-500'}>
                                                            {cat.trend3M > 0 ? '+' : ''}{cat.trend3M.toFixed(0)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* ============ SCORE DE PREVISIBILIDAD ============ */}
                        <div className="space-y-4">
                            <SectionHeader
                                id="forecast-score"
                                title="Score de Previsibilidad"
                                icon={<Target size={18} className="text-purple-500" />}
                            />
                            {expandedSections.has('forecast-score') && (
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className={`p-4 rounded-xl ${getForecastColor(report.forecastScore.rank)}`}>
                                        <div className="text-xs font-bold uppercase mb-2">Ranking</div>
                                        <div className="text-2xl font-black">{getForecastLabel(report.forecastScore.rank)}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Items dentro de ±10%</div>
                                        <div className="text-2xl font-black text-gray-800">{report.forecastScore.withinTolerance.toFixed(0)}%</div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Desvío Total</div>
                                        <div className="text-2xl font-black text-gray-800">{report.forecastScore.totalDeviation.toFixed(0)}%</div>
                                        <div className="text-xs text-gray-500">{formatCurrency(report.forecastScore.absoluteDeviation)}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============ ALERTAS DE RIESGO ============ */}
                        {report.riskAlerts.length > 0 && (
                            <div className="space-y-4">
                                <SectionHeader
                                    id="risks"
                                    title="Alertas de Riesgo"
                                    icon={<AlertTriangle size={18} className="text-red-500" />}
                                    subtitle={`${report.riskAlerts.filter(a => a.severity === 'high').length} alta prioridad`}
                                />
                                {expandedSections.has('risks') && (
                                    <div className="space-y-2">
                                        {report.riskAlerts.map((alert, idx) => (
                                            <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                                                <div className="flex items-start gap-3">
                                                    {alert.severity === 'high' ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />}
                                                    <div className="flex-1">
                                                        <div className="font-medium">{alert.message}</div>
                                                        {alert.amount && <div className="text-xs mt-1 opacity-75">{formatCurrency(alert.amount)}</div>}
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${alert.severity === 'high' ? 'bg-red-200' : alert.severity === 'medium' ? 'bg-amber-200' : 'bg-blue-200'
                                                        }`}>
                                                        {alert.severity === 'high' ? 'ALTO' : alert.severity === 'medium' ? 'MEDIO' : 'BAJO'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ============ ACCIONES RECOMENDADAS ============ */}
                        {report.recommendedActions.length > 0 && (
                            <div className="space-y-4">
                                <SectionHeader
                                    id="actions"
                                    title="Acciones Recomendadas"
                                    icon={<CheckCircle2 size={18} className="text-emerald-500" />}
                                    subtitle={`${report.recommendedActions.length} acciones`}
                                />
                                {expandedSections.has('actions') && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                                            <thead>
                                                <tr className="bg-gray-100 text-gray-700">
                                                    <th className="text-left p-3 font-bold">Acción</th>
                                                    <th className="text-center p-3 font-bold">Impacto</th>
                                                    <th className="text-center p-3 font-bold">Dificultad</th>
                                                    <th className="text-left p-3 font-bold">Owner</th>
                                                    <th className="text-left p-3 font-bold">Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {report.recommendedActions.map((action, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="p-3 text-gray-800 font-medium">{action.action}</td>
                                                        <td className="p-3 text-center">{getImpactBadge(action.impact)}</td>
                                                        <td className="p-3 text-center">{getImpactBadge(action.difficulty)}</td>
                                                        <td className="p-3 text-gray-700 font-medium">{action.owner}</td>
                                                        <td className="p-3 text-gray-600">{action.dueDate}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ============ FORECAST ============ */}
                        <div className="space-y-4">
                            <SectionHeader
                                id="forecast"
                                title="Proyección y Ajustes"
                                icon={<TrendingUp size={18} className="text-blue-500" />}
                            />
                            {expandedSections.has('forecast') && (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Proyección de Cierre</div>
                                        <div className="text-2xl font-black text-gray-800">{formatCurrency(report.forecast.projectedClose)}</div>
                                        <div className="text-xs text-gray-500 mt-1">Si el patrón actual continúa</div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Recomendación Próximo Mes</div>
                                        <div className="text-2xl font-black text-gray-800">{formatCurrency(report.forecast.nextMonthRecommendation)}</div>
                                        <div className="text-xs text-gray-500 mt-1">Presupuesto sugerido (+5% margen)</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============ FOTO DE CAJA ============ */}
                        <div className="space-y-4">
                            <SectionHeader
                                id="cash"
                                title="Foto de Caja"
                                icon={<Wallet size={18} className="text-green-500" />}
                            />
                            {expandedSections.has('cash') && (
                                <div className="grid md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Saldo Inicial</div>
                                        <div className="text-xl font-black text-gray-800">{formatCurrency(report.cashPosition.openingBalance)}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Saldo Final</div>
                                        <div className={`text-xl font-black ${report.cashPosition.closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(report.cashPosition.closingBalance)}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Variación Neta</div>
                                        <div className={`text-xl font-black flex items-center gap-1 ${report.cashPosition.netCashChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {report.cashPosition.netCashChange >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                                            {formatCurrency(Math.abs(report.cashPosition.netCashChange))}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Burn Rate</div>
                                        <div className="text-xl font-black text-gray-800">{formatCurrency(report.cashPosition.burnRate)}</div>
                                        <div className="text-xs text-gray-500">por mes</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <div>{docCode} | {report.entityName} | Generado: {generatedDate.toLocaleString('es-ES')}</div>
                            <div>FinanzaFlow Auditoría © {new Date().getFullYear()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditReportModal;
