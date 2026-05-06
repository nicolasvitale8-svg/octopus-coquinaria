import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Download, Eye, Edit3, Plus, Trash2, Loader2, ChevronDown } from 'lucide-react';
// html2canvas y jspdf se cargan dinámicamente al exportar PDF
import {
    DocumentData,
    DocumentMetadata,
    DocumentType,
    DocumentStatus,
    AccessLevel,
    DOCUMENT_TYPE_LABELS,
    ACCESS_LEVEL_LABELS,
    ChangeLogEntry,
    getDefaultDocument,
    generateDocumentCode,
    getTodayFormatted
} from '../types/documentTypes';

export const DocumentGenerator: React.FC = () => {
    const [document, setDocument] = useState<DocumentData>(getDefaultDocument());
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [exporting, setExporting] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    const updateMetadata = (field: keyof DocumentMetadata, value: string) => {
        setDocument(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }));
    };

    const updateContent = (content: string) => {
        setDocument(prev => ({ ...prev, content }));
    };

    const addChangeLogEntry = () => {
        setDocument(prev => ({
            ...prev,
            changeLog: [
                ...prev.changeLog,
                { version: prev.metadata.version, change: '', date: getTodayFormatted() }
            ]
        }));
    };

    const updateChangeLogEntry = (index: number, field: keyof ChangeLogEntry, value: string) => {
        setDocument(prev => ({
            ...prev,
            changeLog: prev.changeLog.map((entry, i) =>
                i === index ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const removeChangeLogEntry = (index: number) => {
        setDocument(prev => ({
            ...prev,
            changeLog: prev.changeLog.filter((_, i) => i !== index)
        }));
    };

    const handleExportPDF = async () => {
        if (!previewRef.current) return;
        setExporting(true);

        try {
            // Switch to preview tab for export
            const currentTab = activeTab;
            setActiveTab('preview');
            await new Promise(resolve => setTimeout(resolve, 500));

            const html2canvasModule = await import('html2canvas');
            const html2canvas = html2canvasModule.default;
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default;

            const canvas = await html2canvas(previewRef.current, {
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

            const fileName = `${document.metadata.code}_${document.metadata.title.replace(/\s+/g, '-')}_V${document.metadata.version}.pdf`;
            pdf.save(fileName);

            setActiveTab(currentTab);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--color-warning)]/20 rounded-md flex items-center justify-center">
                            <FileText className="text-[var(--color-warning)]" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-wider">Generador de Documentos</h1>
                            <p className="text-sm text-[var(--text-muted)]">Academia Cephalopod • Documentos Controlados</p>
                        </div>
                    </div>
                    <button
                        onClick={handleExportPDF}
                        disabled={exporting || !document.metadata.title}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--color-warning)] text-slate-900 font-black text-sm uppercase tracking-wider rounded-md hover:bg-amber-400 transition-all disabled:opacity-50"
                    >
                        {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {exporting ? 'Generando...' : 'Exportar PDF'}
                    </button>
                </div>

                {/* Metadata Form */}
                <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-md border border-[var(--border-subtle)] p-6">
                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Metadatos del Documento</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Tipo</label>
                            <select
                                value={document.metadata.type}
                                onChange={e => {
                                    const type = e.target.value as DocumentType;
                                    updateMetadata('type', type);
                                    updateMetadata('code', generateDocumentCode(type, 1));
                                }}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm font-bold focus:border-[var(--color-warning)] outline-none"
                            >
                                {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Código</label>
                            <input
                                type="text"
                                value={document.metadata.code}
                                onChange={e => updateMetadata('code', e.target.value)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm font-mono focus:border-[var(--color-warning)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Versión</label>
                            <input
                                type="text"
                                value={document.metadata.version}
                                onChange={e => updateMetadata('version', e.target.value)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm font-bold focus:border-[var(--color-warning)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Estado</label>
                            <select
                                value={document.metadata.status}
                                onChange={e => updateMetadata('status', e.target.value)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm font-bold focus:border-[var(--color-warning)] outline-none"
                            >
                                <option value="BORRADOR">BORRADOR</option>
                                <option value="EN REVISIÓN">EN REVISIÓN</option>
                                <option value="VIGENTE">VIGENTE</option>
                                <option value="OBSOLETO">OBSOLETO</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Título</label>
                            <input
                                type="text"
                                value={document.metadata.title}
                                onChange={e => updateMetadata('title', e.target.value)}
                                placeholder="Ej: Por dónde empezar en la Academia Cephalopod"
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--color-warning)] outline-none placeholder:text-[var(--text-muted)]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Propietario</label>
                            <input
                                type="text"
                                value={document.metadata.owner}
                                onChange={e => updateMetadata('owner', e.target.value)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--color-warning)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">Acceso</label>
                            <select
                                value={document.metadata.access}
                                onChange={e => updateMetadata('access', e.target.value as AccessLevel)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] text-sm font-bold focus:border-[var(--color-warning)] outline-none"
                            >
                                {Object.entries(ACCESS_LEVEL_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('edit')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'edit'
                            ? 'bg-[var(--color-warning)] text-slate-900'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <Edit3 size={16} /> Editor
                    </button>
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-md text-sm font-black uppercase tracking-wider transition-all ${activeTab === 'preview'
                            ? 'bg-[var(--color-warning)] text-slate-900'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            }`}
                    >
                        <Eye size={16} /> Vista Previa
                    </button>
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Editor */}
                    {activeTab === 'edit' && (
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-md border border-[var(--border-subtle)] p-6">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Contenido (Markdown)</h3>
                                <textarea
                                    value={document.content}
                                    onChange={e => updateContent(e.target.value)}
                                    className="w-full h-96 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md px-4 py-3 text-[var(--text-primary)] font-mono text-sm resize-none focus:border-[var(--color-warning)] outline-none"
                                    placeholder="Escribí tu contenido en Markdown..."
                                />
                            </div>

                            {/* Change Log */}
                            <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-md border border-[var(--border-subtle)] p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Registro de Cambios</h3>
                                    <button
                                        onClick={addChangeLogEntry}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface-soft)] rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-soft)]"
                                    >
                                        <Plus size={14} /> Agregar
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {document.changeLog.map((entry, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                value={entry.version}
                                                onChange={e => updateChangeLogEntry(idx, 'version', e.target.value)}
                                                className="w-20 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs font-mono"
                                                placeholder="v1.0"
                                            />
                                            <input
                                                type="text"
                                                value={entry.change}
                                                onChange={e => updateChangeLogEntry(idx, 'change', e.target.value)}
                                                className="flex-1 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs"
                                                placeholder="Descripción del cambio"
                                            />
                                            <input
                                                type="text"
                                                value={entry.date}
                                                onChange={e => updateChangeLogEntry(idx, 'date', e.target.value)}
                                                className="w-28 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs"
                                                placeholder="dd/mm/yyyy"
                                            />
                                            <button
                                                onClick={() => removeChangeLogEntry(idx)}
                                                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Approvals */}
                            <div className="bg-[var(--bg-surface)]/50 backdrop-blur-xl rounded-md border border-[var(--border-subtle)] p-6">
                                <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Aprobaciones</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Elaboró</label>
                                        <input
                                            type="text"
                                            value={document.approvals.elaboratedBy}
                                            onChange={e => setDocument(prev => ({ ...prev, approvals: { ...prev.approvals, elaboratedBy: e.target.value } }))}
                                            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Revisó</label>
                                        <input
                                            type="text"
                                            value={document.approvals.reviewedBy}
                                            onChange={e => setDocument(prev => ({ ...prev, approvals: { ...prev.approvals, reviewedBy: e.target.value } }))}
                                            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--text-muted)] uppercase block mb-1">Aprobó</label>
                                        <input
                                            type="text"
                                            value={document.approvals.approvedBy}
                                            onChange={e => setDocument(prev => ({ ...prev, approvals: { ...prev.approvals, approvedBy: e.target.value } }))}
                                            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    {activeTab === 'preview' && (
                        <div className="lg:col-span-2">
                            <div ref={previewRef} className="bg-white rounded-lg shadow-2xl" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {/* PDF Header */}
                                <div className="p-8 pb-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <img src="/logo_simple.png" alt="Cephalopod" className="w-12 h-12 object-contain" />
                                            <div>
                                                <div className="text-lg font-black text-gray-800">ACADEMIA CEPHALOPOD</div>
                                                <div className="text-xs text-[var(--text-muted)]">Guía operativa | Documento controlado</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metadata Table */}
                                    <table className="w-full text-sm border border-gray-300 mb-6">
                                        <tbody>
                                            <tr className="border-b border-gray-300">
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-24">Código</td>
                                                <td className="py-2 px-3 text-gray-800 border-r border-gray-300">{document.metadata.code}</td>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-24">Versión</td>
                                                <td className="py-2 px-3 text-gray-800 border-r border-gray-300 w-20">{document.metadata.version}</td>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-20">Fecha</td>
                                                <td className="py-2 px-3 text-gray-800 border-r border-gray-300 w-24">{document.metadata.date}</td>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-20">Estado</td>
                                                <td className="py-2 px-3">
                                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${document.metadata.status === 'VIGENTE' ? 'bg-emerald-100 text-emerald-700' :
                                                        document.metadata.status === 'BORRADOR' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {document.metadata.status}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-gray-300">
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300">Título</td>
                                                <td className="py-2 px-3 text-gray-800" colSpan={3}>{document.metadata.title}</td>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300">Acceso</td>
                                                <td className="py-2 px-3 text-gray-800" colSpan={3}>{ACCESS_LEVEL_LABELS[document.metadata.access]}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300">Propietario</td>
                                                <td className="py-2 px-3 text-gray-800" colSpan={3}>{document.metadata.owner}</td>
                                                <td className="py-2 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300">Referencia</td>
                                                <td className="py-2 px-3 text-gray-800" colSpan={3}>{document.metadata.reference}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Document Content */}
                                <div className="px-8 pb-6">
                                    <div className="prose prose-sm max-w-none text-gray-800">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ children }) => <h1 className="text-2xl font-black text-gray-800 mt-6 mb-4">{children}</h1>,
                                                h2: ({ children }) => <h2 className="text-xl font-bold text-gray-800 mt-5 mb-3">{children}</h2>,
                                                h3: ({ children }) => <h3 className="text-lg font-bold text-gray-700 mt-4 mb-2">{children}</h3>,
                                                p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-3">{children}</p>,
                                                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                                                li: ({ children }) => <li className="text-gray-700">{children}</li>,
                                                blockquote: ({ children }) => (
                                                    <blockquote className="border-l-4 border-amber-400 bg-amber-50 pl-4 py-2 my-4 text-gray-700 italic">
                                                        {children}
                                                    </blockquote>
                                                ),
                                                table: ({ children }) => (
                                                    <table className="w-full border-collapse border border-gray-300 my-4">{children}</table>
                                                ),
                                                th: ({ children }) => (
                                                    <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold">{children}</th>
                                                ),
                                                td: ({ children }) => (
                                                    <td className="border border-gray-300 px-3 py-2">{children}</td>
                                                ),
                                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                                code: ({ children }) => (
                                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
                                                ),
                                            }}
                                        >
                                            {document.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>

                                {/* Change Log */}
                                {document.changeLog.length > 0 && (
                                    <div className="px-8 pb-6">
                                        <h3 className="text-sm font-bold text-gray-800 mb-3">Registro de Cambios</h3>
                                        <table className="w-full text-sm border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="py-2 px-3 text-left font-semibold border-r border-gray-300 w-24">Versión</th>
                                                    <th className="py-2 px-3 text-left font-semibold border-r border-gray-300">Cambio</th>
                                                    <th className="py-2 px-3 text-left font-semibold w-28">Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {document.changeLog.map((entry, idx) => (
                                                    <tr key={idx} className="border-t border-gray-300">
                                                        <td className="py-2 px-3 border-r border-gray-300">{entry.version}</td>
                                                        <td className="py-2 px-3 border-r border-gray-300">{entry.change}</td>
                                                        <td className="py-2 px-3">{entry.date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Approvals */}
                                <div className="px-8 pb-6">
                                    <h3 className="text-sm font-bold text-gray-800 mb-3">Aprobaciones</h3>
                                    <table className="w-full text-sm border border-gray-300">
                                        <tbody>
                                            <tr>
                                                <td className="py-3 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-24">Elaboró:</td>
                                                <td className="py-3 px-3 border-r border-gray-300">{document.approvals.elaboratedBy || '_________________'}</td>
                                                <td className="py-3 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-24">Revisó:</td>
                                                <td className="py-3 px-3 border-r border-gray-300">{document.approvals.reviewedBy || '_________________'}</td>
                                                <td className="py-3 px-3 font-semibold text-gray-600 bg-gray-50 border-r border-gray-300 w-24">Aprobó:</td>
                                                <td className="py-3 px-3">{document.approvals.approvedBy || '_________________'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="px-8 py-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center text-xs text-[var(--text-muted)]">
                                        <div>{document.metadata.code} | v{document.metadata.version} | {document.metadata.reference}</div>
                                        <div>Página 1</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentGenerator;
