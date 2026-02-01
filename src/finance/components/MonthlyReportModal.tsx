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

// Generate document code based on entity and date
const generateDocCode = (entityName: string, month: number, year: number) => {
    const prefix = entityName.split(' ').map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3) || 'OCT';
    return `${prefix}-FIN-${String(month + 1).padStart(2, '0')}-${year}`;
};

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ report, onClose }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [exporting, setExporting] = useState(false);

    const docCode = generateDocCode(report.entityName, report.month, report.year);
    const generatedDate = new Date(report.generatedAt);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;

        setExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
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

            const fileName = `${docCode}_Informe_Financiero.pdf`;
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
            <span className={`font-bold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
                {delta > 0 ? '↑' : delta < 0 ? '↓' : '–'} {Math.abs(delta).toFixed(1)}%
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-[100] p-4 pt-10 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-white rounded-lg w-full max-w-4xl shadow-2xl relative">
                {/* Modal Header Controls */}
                <div className="sticky top-0 z-20 flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <FileText size={24} className="text-cyan-600" />
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Vista Previa del Informe</h2>
                            <p className="text-xs text-gray-500">{docCode}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExportPDF}
                            disabled={exporting}
                            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-all disabled:opacity-50"
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
                            className="p-2.5 bg-white rounded-lg text-gray-500 hover:text-gray-700 transition-all border border-gray-200 hover:border-gray-300"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Report Content - This is what gets exported to PDF */}
                <div ref={reportRef} className="bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {/* Document Header - ISO Style */}
                    <div className="px-8 pt-6">
                        {/* Top Header Row */}
                        <div className="flex items-start justify-between border-b-4 border-cyan-500 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-black text-lg">🐙</span>
                                </div>
                                <div>
                                    <div className="text-lg font-black text-gray-800 tracking-wide">FINANZAFLOW</div>
                                    <div className="text-xs text-gray-500">Informe Financiero | Documento controlado</div>
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-500">
                                <div>{docCode} | v1.0</div>
                                <div>Página 1/1</div>
                            </div>
                        </div>

                        {/* Metadata Table */}
                        <table className="w-full mt-4 text-sm border-collapse">
                            <tbody>
                                <tr>
                                    <td className="py-2 pr-4 font-semibold text-gray-600 w-28">Código</td>
                                    <td className="py-2 text-gray-800 w-1/3">{docCode}</td>
                                    <td className="py-2 pr-4 font-semibold text-gray-600 w-28">Versión</td>
                                    <td className="py-2 text-gray-800">1.0</td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 font-semibold text-gray-600">Fecha</td>
                                    <td className="py-2 text-gray-800">
                                        {generatedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="py-2 pr-4 font-semibold text-gray-600">Estado</td>
                                    <td className="py-2">
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">VIGENTE</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 font-semibold text-gray-600">Título</td>
                                    <td className="py-2 text-gray-800" colSpan={3}>
                                        Informe Financiero - {MONTH_NAMES[report.month]} {report.year}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-2 pr-4 font-semibold text-gray-600">Propietario</td>
                                    <td className="py-2 text-gray-800">{report.entityName}</td>
                                    <td className="py-2 pr-4 font-semibold text-gray-600">Acceso</td>
                                    <td className="py-2 text-gray-800">PRIVADO</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Document Title */}
                        <div className="mt-6 mb-6">
                            <h1 className="text-2xl font-black text-gray-800">
                                Cierre Financiero {MONTH_NAMES[report.month]} {report.year}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Resumen ejecutivo del período • Generado automáticamente
                            </p>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="px-8 pb-8 space-y-6">
                        {/* Executive Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className="text-emerald-600" />
                                    <span className="text-xs font-bold text-emerald-700 uppercase">Total Ingresos</span>
                                </div>
                                <p className="text-2xl font-black text-gray-800">{formatCurrency(report.totalIn)}</p>
                                {report.comparison.prevMonth && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        vs anterior: {renderDelta(report.comparison.incomeDelta)}
                                    </p>
                                )}
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown size={16} className="text-red-600" />
                                    <span className="text-xs font-bold text-red-700 uppercase">Total Egresos</span>
                                </div>
                                <p className="text-2xl font-black text-gray-800">{formatCurrency(report.totalOut)}</p>
                                {report.comparison.prevMonth && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        vs anterior: {renderDelta(report.comparison.expenseDelta, true)}
                                    </p>
                                )}
                            </div>

                            <div className={`${report.netBalance >= 0 ? 'bg-cyan-50 border-cyan-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {report.netBalance >= 0 ? (
                                        <TrendingUp size={16} className="text-cyan-600" />
                                    ) : (
                                        <TrendingDown size={16} className="text-red-600" />
                                    )}
                                    <span className={`text-xs font-bold uppercase ${report.netBalance >= 0 ? 'text-cyan-700' : 'text-red-700'}`}>
                                        Resultado Neto
                                    </span>
                                </div>
                                <p className={`text-2xl font-black ${report.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatCurrency(report.netBalance)}
                                </p>
                            </div>
                        </div>

                        {/* Balances Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Balance Inicial del Período</p>
                                <p className="text-xl font-bold text-gray-800">{formatCurrency(report.openingBalance)}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Balance Final del Período</p>
                                <p className="text-xl font-bold text-gray-800">{formatCurrency(report.closingBalance)}</p>
                            </div>
                        </div>

                        {/* Expense Breakdown Table */}
                        {report.expenseBreakdown.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <TrendingDown size={14} className="text-red-500" />
                                    Distribución de Egresos por Categoría
                                </h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Categoría</th>
                                            <th className="text-right py-2 px-3 font-semibold text-gray-600">Monto</th>
                                            <th className="text-right py-2 px-3 font-semibold text-gray-600">%</th>
                                            <th className="py-2 px-3 w-32"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.expenseBreakdown.slice(0, 8).map((cat, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="py-2 px-3 text-gray-800">{cat.categoryName}</td>
                                                <td className="py-2 px-3 text-right font-semibold text-red-600">{formatCurrency(cat.amount)}</td>
                                                <td className="py-2 px-3 text-right text-gray-600">{cat.percentage.toFixed(1)}%</td>
                                                <td className="py-2 px-3">
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-red-500 rounded-full"
                                                            style={{ width: `${cat.percentage}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Income Breakdown Table */}
                        {report.incomeBreakdown.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
                                    <TrendingUp size={14} className="text-emerald-500" />
                                    Distribución de Ingresos por Categoría
                                </h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-600">Categoría</th>
                                            <th className="text-right py-2 px-3 font-semibold text-gray-600">Monto</th>
                                            <th className="text-right py-2 px-3 font-semibold text-gray-600">%</th>
                                            <th className="py-2 px-3 w-32"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.incomeBreakdown.slice(0, 8).map((cat, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="py-2 px-3 text-gray-800">{cat.categoryName}</td>
                                                <td className="py-2 px-3 text-right font-semibold text-emerald-600">{formatCurrency(cat.amount)}</td>
                                                <td className="py-2 px-3 text-right text-gray-600">{cat.percentage.toFixed(1)}%</td>
                                                <td className="py-2 px-3">
                                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full"
                                                            style={{ width: `${cat.percentage}%` }}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Comparison with Previous Month */}
                        {report.comparison.prevMonth && (
                            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                                <h3 className="text-sm font-bold text-cyan-800 uppercase mb-3">
                                    📊 Comparativa con {MONTH_NAMES[report.month === 0 ? 11 : report.month - 1]} {report.month === 0 ? report.year - 1 : report.year}
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Ingresos Anterior</p>
                                        <p className="font-bold text-gray-800">{formatCurrency(report.comparison.prevMonth.totalIn)}</p>
                                        <p className="text-xs mt-1">{renderDelta(report.comparison.incomeDelta)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Egresos Anterior</p>
                                        <p className="font-bold text-gray-800">{formatCurrency(report.comparison.prevMonth.totalOut)}</p>
                                        <p className="text-xs mt-1">{renderDelta(report.comparison.expenseDelta, true)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Resultado Anterior</p>
                                        <p className={`font-bold ${report.comparison.prevMonth.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {formatCurrency(report.comparison.prevMonth.netBalance)}
                                        </p>
                                        <p className="text-xs mt-1">
                                            <span className={`font-bold ${report.comparison.balanceDelta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {report.comparison.balanceDelta >= 0 ? '+' : ''}{formatCurrency(report.comparison.balanceDelta)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="border-t border-gray-200 pt-4 mt-6">
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <div>
                                    Generado: {generatedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div>
                                    FinanzaFlow • Octopus System • {docCode}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthlyReportModal;
