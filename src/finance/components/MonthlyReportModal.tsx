import React, { useRef, useState } from 'react';
import { X, Download, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, FileText, Loader2 } from 'lucide-react';
import { MonthReport } from '../financeTypes';
import { formatCurrency } from '../utils/calculations';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface MonthlyReportModalProps {
    report: MonthReport;
    onClose: () => void;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ report, onClose }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#0b1221',
                useCORS: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

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

            const fileName = `Informe_${MONTH_NAMES[report.month]}_${report.year}_${report.entityName.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    const renderDelta = (delta: number, inverted = false) => {
        const isPositive = inverted ? delta < 0 : delta > 0;
        const isNegative = inverted ? delta > 0 : delta < 0;

        return (
            <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-fin-muted'
                }`}>
                {delta > 0 ? <ArrowUp size={12} /> : delta < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                <span>{Math.abs(delta).toFixed(1)}%</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-fin-bg/60 backdrop-blur-xl flex items-start justify-center z-[100] p-4 pt-10 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-[#0b1221] rounded-[32px] w-full max-w-4xl border border-white/10 shadow-2xl relative">
                {/* Header Controls */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-6 bg-[#0b1221]/95 backdrop-blur-xl border-b border-white/5 rounded-t-[32px]">
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-brand" />
                        <div>
                            <h2 className="text-lg font-black text-white">Informe Mensual</h2>
                            <p className="text-[10px] font-bold text-fin-muted uppercase tracking-widest">
                                {MONTH_NAMES[report.month]} {report.year}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-brand/80 transition-all disabled:opacity-50"
                        >
                            {exporting ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {exporting ? 'Generando...' : 'Exportar PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-fin-bg rounded-xl text-fin-muted hover:text-white transition-all border border-fin-border"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Report Content - This is what gets exported to PDF */}
                <div ref={reportRef} className="p-8 space-y-8" style={{ backgroundColor: '#0b1221' }}>
                    {/* Report Header */}
                    <div className="text-center pb-6 border-b border-white/10">
                        <div className="inline-block mb-4">
                            <div className="text-[10px] font-black text-brand uppercase tracking-[0.4em] mb-1">FINANZAFLOW</div>
                            <div className="text-[8px] font-bold text-fin-muted uppercase tracking-widest">Octopus System</div>
                        </div>
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
                            Informe Financiero
                        </h1>
                        <p className="text-lg font-black text-brand">
                            {MONTH_NAMES[report.month]} {report.year}
                        </p>
                        <p className="text-sm font-bold text-fin-muted mt-2">{report.entityName}</p>
                        <p className="text-[10px] text-fin-muted/50 mt-4">
                            Generado el {new Date(report.generatedAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    {/* Executive Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp size={18} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ingresos</span>
                            </div>
                            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(report.totalIn)}</p>
                            {report.comparison.prevMonth && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-fin-muted">vs mes anterior:</span>
                                    {renderDelta(report.comparison.incomeDelta)}
                                </div>
                            )}
                        </div>

                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown size={18} className="text-red-400" />
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Egresos</span>
                            </div>
                            <p className="text-2xl font-black text-white tabular-nums">{formatCurrency(report.totalOut)}</p>
                            {report.comparison.prevMonth && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-fin-muted">vs mes anterior:</span>
                                    {renderDelta(report.comparison.expenseDelta, true)}
                                </div>
                            )}
                        </div>

                        <div className={`${report.netBalance >= 0 ? 'bg-brand/5 border-brand/20' : 'bg-red-500/5 border-red-500/20'} border rounded-2xl p-5`}>
                            <div className="flex items-center gap-2 mb-3">
                                {report.netBalance >= 0 ? (
                                    <TrendingUp size={18} className="text-brand" />
                                ) : (
                                    <TrendingDown size={18} className="text-red-400" />
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest ${report.netBalance >= 0 ? 'text-brand' : 'text-red-400'}`}>
                                    Resultado
                                </span>
                            </div>
                            <p className={`text-2xl font-black tabular-nums ${report.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(report.netBalance)}
                            </p>
                            {report.comparison.prevMonth && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-fin-muted">vs mes anterior:</span>
                                    <span className={`text-xs font-bold ${report.comparison.balanceDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {report.comparison.balanceDelta >= 0 ? '+' : ''}{formatCurrency(report.comparison.balanceDelta)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Balances */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-fin-card/50 border border-fin-border rounded-2xl p-5">
                            <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-2">Balance Inicial</p>
                            <p className="text-xl font-black text-white tabular-nums">{formatCurrency(report.openingBalance)}</p>
                        </div>
                        <div className="bg-fin-card/50 border border-fin-border rounded-2xl p-5">
                            <p className="text-[10px] font-black text-fin-muted uppercase tracking-widest mb-2">Balance Final</p>
                            <p className="text-xl font-black text-white tabular-nums">{formatCurrency(report.closingBalance)}</p>
                        </div>
                    </div>

                    {/* Expense Breakdown */}
                    {report.expenseBreakdown.length > 0 && (
                        <div className="bg-fin-card/30 border border-fin-border rounded-2xl p-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingDown size={16} className="text-red-400" />
                                Distribución de Egresos
                            </h3>
                            <div className="space-y-3">
                                {report.expenseBreakdown.slice(0, 8).map((cat, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-white">{cat.categoryName}</span>
                                                <span className="text-xs font-black text-red-400 tabular-nums">{formatCurrency(cat.amount)}</span>
                                            </div>
                                            <div className="h-2 bg-fin-bg rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                                                    style={{ width: `${cat.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-fin-muted w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Income Breakdown */}
                    {report.incomeBreakdown.length > 0 && (
                        <div className="bg-fin-card/30 border border-fin-border rounded-2xl p-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-emerald-400" />
                                Distribución de Ingresos
                            </h3>
                            <div className="space-y-3">
                                {report.incomeBreakdown.slice(0, 8).map((cat, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-bold text-white">{cat.categoryName}</span>
                                                <span className="text-xs font-black text-emerald-400 tabular-nums">{formatCurrency(cat.amount)}</span>
                                            </div>
                                            <div className="h-2 bg-fin-bg rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                    style={{ width: `${cat.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-fin-muted w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comparison Section */}
                    {report.comparison.prevMonth && (
                        <div className="bg-gradient-to-br from-brand/5 to-purple-500/5 border border-brand/20 rounded-2xl p-6">
                            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
                                📊 Comparativa con {MONTH_NAMES[report.month === 0 ? 11 : report.month - 1]}
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-fin-muted uppercase mb-1">Ingresos</p>
                                    <p className="text-sm font-black text-white tabular-nums mb-1">
                                        {formatCurrency(report.comparison.prevMonth.totalIn)}
                                    </p>
                                    {renderDelta(report.comparison.incomeDelta)}
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-fin-muted uppercase mb-1">Egresos</p>
                                    <p className="text-sm font-black text-white tabular-nums mb-1">
                                        {formatCurrency(report.comparison.prevMonth.totalOut)}
                                    </p>
                                    {renderDelta(report.comparison.expenseDelta, true)}
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-fin-muted uppercase mb-1">Resultado</p>
                                    <p className={`text-sm font-black tabular-nums mb-1 ${report.comparison.prevMonth.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                        {formatCurrency(report.comparison.prevMonth.netBalance)}
                                    </p>
                                    <span className={`text-xs font-bold ${report.comparison.balanceDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {report.comparison.balanceDelta >= 0 ? '+' : ''}{formatCurrency(report.comparison.balanceDelta)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center pt-6 border-t border-white/10">
                        <p className="text-[9px] font-bold text-fin-muted/50 uppercase tracking-widest">
                            Este informe fue generado automáticamente por FinanzaFlow • Octopus System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReportModal;
