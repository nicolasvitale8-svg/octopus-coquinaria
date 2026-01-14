import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from '../services/supabaseService';
import { Account, Category, SubCategory, ImportLine, TransactionType, Transaction, TextCategoryRule } from '../financeTypes';
import { parseImportText, applyRules } from '../utils/importEngine';
import { isCreditCardStatement, parseCreditCardStatement, toImportLines as ccToImportLines } from '../utils/creditCardParser';
import { formatCurrency } from '../utils/calculations';
import { Camera, Loader2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Sparkles, AlertTriangle, Trash2, Info, RotateCcw, FileUp, CreditCard, RefreshCcw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinanza } from '../context/FinanzaContext';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../services/logger';
import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de pdf.js - usar unpkg como CDN alternativo
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const ImportPage: React.FC = () => {
  const { activeEntity } = useFinanza();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  const [importedLines, setImportedLines] = useState<ImportLine[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [rules, setRules] = useState<TextCategoryRule[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<Transaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [importMode, setImportMode] = useState<'manual' | 'auto'>('manual');
  const [mpSyncStatus, setMpSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [mpSyncResult, setMpSyncResult] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const [mpSyncDays, setMpSyncDays] = useState(30);

  useEffect(() => { loadData(); }, [activeEntity]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bId = activeEntity.id || undefined;
      const [a, c, subCat, r, t] = await Promise.all([
        SupabaseService.getAccounts(bId),
        SupabaseService.getCategories(bId),
        SupabaseService.getAllSubCategories(bId),
        SupabaseService.getRules(bId),
        SupabaseService.getTransactions(bId)
      ]);
      setAccounts(a);
      setCategories(c);
      setSubCategories(subCat);
      setRules(r);
      setExistingTransactions(t);
    } catch (error) {
      logger.error('Error loading import data', { context: 'ImportPage', data: error });
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar movimientos desde Mercado Pago API - Ahora con preview y validación
  const syncMercadoPago = async () => {
    // Auto-seleccionar cuenta de Mercado Pago
    const mpAccount = accounts.find(a =>
      a.name.toLowerCase().includes('mercado pago') ||
      a.name.toLowerCase().includes('mercadopago') ||
      a.name.toLowerCase() === 'mp'
    );

    if (!mpAccount) {
      alert("No se encontró una cuenta de Mercado Pago. Por favor, crea una cuenta con ese nombre primero.");
      return;
    }

    // Auto-seleccionar la cuenta de MP para la importación
    setSelectedAccountId(mpAccount.id);

    setMpSyncStatus('syncing');
    setMpSyncResult(null);
    try {
      // Usar nueva Edge Function que solo fetchea (no inserta)
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VqNqrcKqNFsE53xeSKtjnw_dmP0RIYt';
      const response = await fetch(
        `https://hmyzuuujyurvyuusvyzp.supabase.co/functions/v1/mp-fetch-movements?days=${mpSyncDays}`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          }
        }
      );
      const data = await response.json();

      if (data.success && data.movements) {
        // Convertir movimientos de MP a formato ImportLine
        const mpLines: ImportLine[] = data.movements.map((mov: any) => ({
          id: crypto.randomUUID(),
          rawText: mov.description,
          date: mov.date,
          description: mov.description,
          amount: mov.amount,
          type: mov.type as TransactionType,
          isSelected: true,
          isDuplicate: false,
          categoryId: undefined,
          subCategoryId: undefined,
          // Metadata para tracking
          external_id: mov.external_id,
          source: mov.source,
        }));

        // Aplicar reglas de auto-categorización
        let linesWithRules = applyRules(mpLines, rules);

        // Marcar duplicados
        linesWithRules = linesWithRules.map(line => ({
          ...line,
          isDuplicate: !!existingTransactions.find(t =>
            t.accountId === mpAccount.id &&
            Math.abs(t.amount - line.amount) < 0.01 &&
            t.type === line.type &&
            t.date === line.date
          ),
          isSelected: !existingTransactions.find(t =>
            t.accountId === mpAccount.id &&
            Math.abs(t.amount - line.amount) < 0.01 &&
            t.type === line.type &&
            t.date === line.date
          )
        }));

        setMpSyncStatus('success');
        setMpSyncResult({ inserted: 0, skipped: 0, total: data.total });

        // Cargar en la tabla de validación (Step 2)
        setImportedLines(linesWithRules);
        setStep(2);

        logger.info('MP movements loaded for validation', {
          context: 'ImportPage',
          data: { total: linesWithRules.length, withRules: linesWithRules.filter(l => l.categoryId).length }
        });
      } else {
        setMpSyncStatus('error');
        logger.error('Error syncing MP', { context: 'ImportPage', data });
      }
    } catch (error) {
      setMpSyncStatus('error');
      logger.error('Error syncing MP', { context: 'ImportPage', data: error });
    }
  };

  // Función para extraer texto de un PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setScanStatus(`Procesando página ${pageNum} de ${pdf.numPages}...`);
        setScanProgress(Math.round((pageNum / pdf.numPages) * 100));

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText;
    } catch (pdfError) {
      logger.error('Error procesando PDF', { context: 'ImportPage', data: pdfError });
      throw new Error('No se pudo leer el PDF. Puede que esté protegido o dañado.');
    }
  };

  // Función unificada para manejar archivos (imágenes y PDFs)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanStatus('Iniciando...');

    try {
      let extractedText = '';

      if (file.type === 'application/pdf') {
        // Procesar PDF
        setScanStatus('Extrayendo texto del PDF...');
        extractedText = await extractTextFromPDF(file);
      } else {
        // Procesar imagen con OCR
        setScanStatus('Reconociendo texto de la imagen...');
        const { data: { text } } = await Tesseract.recognize(file, 'spa', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100));
            }
          }
        });
        extractedText = text;
      }

      setRawText(prev => (prev ? prev + '\n\n' : '') + extractedText);
      setScanStatus('¡Completado!');
    } catch (err) {
      logger.error('Error procesando archivo', { context: 'ImportPage', data: err });
      alert("Error al procesar el archivo. Intenta con otro formato o archivo más claro.");
    } finally {
      setIsScanning(false);
      // Reset file input para permitir subir el mismo archivo de nuevo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearText = () => {
    setRawText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processText = () => {
    if (!selectedAccountId) return alert("Por favor, selecciona la cuenta donde se guardarán los movimientos.");

    let lines: ImportLine[] = [];

    // Detectar automáticamente si es un resumen de tarjeta de crédito
    if (isCreditCardStatement(rawText)) {
      const ccStatement = parseCreditCardStatement(rawText);
      if (ccStatement && ccStatement.lines.length > 0) {
        // Convertir a ImportLines y aplicar reglas
        lines = ccToImportLines(ccStatement).map(l => ({ ...l, categoryId: undefined, subCategoryId: undefined })) as ImportLine[];
        logger.debug('Resumen de TC detectado', { context: 'ImportPage', data: { cardType: ccStatement.cardType, count: ccStatement.lines.length } });
      }
    }

    // Si no es TC o no se pudo parsear, usar parser normal
    if (lines.length === 0) {
      lines = parseImportText(rawText);
    }

    // En modo manual, sobrescribir la fecha con la seleccionada por el usuario
    if (importMode === 'manual' && importDate) {
      lines = lines.map(line => ({ ...line, date: importDate }));
    }

    // Aplicar reglas de auto-categorización
    lines = applyRules(lines, rules).map(line => ({
      ...line,
      isDuplicate: !!existingTransactions.find(t =>
        t.accountId === selectedAccountId &&
        Math.abs(t.amount - line.amount) < 0.01 &&
        t.type === line.type &&
        t.date === line.date
      )
    }));

    if (lines.length === 0) return alert("No pudimos detectar movimientos en el texto. Asegúrate de que la imagen sea legible.");

    // Auto-unselect duplicates
    setImportedLines(lines.map(l => ({ ...l, isSelected: !l.isDuplicate })));
    setStep(2);
  };

  const handleImport = async () => {
    if (isImporting) return; // Prevenir doble clic

    const toImport = importedLines.filter(l => l.isSelected && l.categoryId);
    if (toImport.length === 0) {
      alert("No hay movimientos seleccionados con categoría asignada.");
      return;
    }

    setIsImporting(true);

    try {
      const bId = activeEntity.id || undefined;

      // Importar las transacciones
      await Promise.all(toImport.map(line =>
        SupabaseService.addTransaction({
          date: line.date,
          description: line.description,
          amount: line.amount,
          type: line.type,
          accountId: selectedAccountId,
          categoryId: line.categoryId!,
          subCategoryId: line.subCategoryId
        }, bId)
      ));

      // Auto-aprender: crear reglas para las asignaciones manuales que no tenían regla
      const linesToLearn = toImport.filter(line => {
        // Solo crear regla si la descripción no fue categorizada por una regla existente
        const hasRule = rules.some(r =>
          r.isActive && line.description.toLowerCase().includes(r.pattern.toLowerCase())
        );
        return !hasRule && line.categoryId;
      });

      // Crear reglas automáticamente (solo para descripciones únicas)
      const learnedPatterns = new Set<string>();
      for (const line of linesToLearn) {
        // Extraer palabra clave de la descripción (primeras 2-3 palabras significativas)
        const words = line.description.split(/\s+/).filter(w => w.length > 3).slice(0, 2);
        const pattern = words.join(' ').toLowerCase();

        if (pattern.length > 3 && !learnedPatterns.has(pattern)) {
          learnedPatterns.add(pattern);
          try {
            await SupabaseService.saveRule({
              pattern: pattern,
              categoryId: line.categoryId!,
              subCategoryId: line.subCategoryId,
              matchType: 'contains',
              isActive: true
            }, bId);
          } catch (e) {
            logger.warn('Error creating rule', { context: 'ImportPage', data: e });
          }
        }
      }

      alert(`${toImport.length} movimientos importados con éxito.${learnedPatterns.size > 0 ? ` Se crearon ${learnedPatterns.size} reglas automáticamente.` : ''}`);
      navigate('/finance/transactions');
    } catch (error) {
      logger.error('Error importing transactions', { context: 'ImportPage', data: error });
      alert("Ocurrió un error al importar los movimientos.");
      setIsImporting(false);
    }
  };

  if (step === 1) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 animate-fade-in pb-20">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight">Sincronizador Inteligente</h1>
          <p className="text-fin-muted max-w-lg mx-auto font-medium">Carga capturas de tus billeteras digitales (MercadoPago, Lemon, Brubank) para automatizar tu registro.</p>
        </div>

        {/* Sincronización Automática con Mercado Pago - Solo Admin */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-[#009ee3]/20 to-brand/20 p-8 rounded-[32px] border border-[#009ee3]/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#009ee3]/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#009ee3] rounded-2xl flex items-center justify-center shadow-lg shadow-[#009ee3]/30">
                  <Zap className="text-white" size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Mercado Pago API</h2>
                  <p className="text-fin-muted text-sm">Sincronización automática de movimientos</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-fin-muted uppercase">Últimos</label>
                  <select
                    value={mpSyncDays}
                    onChange={e => setMpSyncDays(Number(e.target.value))}
                    className="bg-fin-bg border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm focus:border-brand outline-none"
                  >
                    <option value={7}>7 días</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                    <option value={90}>90 días</option>
                  </select>
                </div>

                <button
                  onClick={syncMercadoPago}
                  disabled={mpSyncStatus === 'syncing'}
                  className="flex items-center gap-3 px-6 py-3 bg-[#009ee3] hover:bg-[#00b1ff] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#009ee3]/30 transition-all active:scale-95"
                >
                  {mpSyncStatus === 'syncing' ? (
                    <><Loader2 className="animate-spin" size={18} /> Sincronizando...</>
                  ) : (
                    <><RefreshCcw size={18} /> Sincronizar MP</>
                  )}
                </button>

                {mpSyncStatus === 'success' && mpSyncResult && (
                  <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-fade-in">
                    <CheckCircle2 size={18} />
                    <span>{mpSyncResult.inserted} nuevos, {mpSyncResult.skipped} existentes</span>
                  </div>
                )}

                {mpSyncStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-sm font-bold animate-fade-in">
                    <AlertTriangle size={18} />
                    <span>Error al sincronizar</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-fin-card p-10 rounded-[32px] border border-fin-border shadow-2xl space-y-10 relative overflow-hidden">
          {/* Progress Overlay during Scan */}
          {isScanning && (
            <div className="absolute inset-0 z-20 bg-fin-card/60 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center animate-fade-in">
              <div className="relative mb-8">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-fin-border" />
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * scanProgress) / 100} className="text-brand transition-all duration-300 stroke-round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white tabular-nums">{scanProgress}%</span>
                </div>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Procesando Imagen...</h3>
              <p className="text-fin-muted text-sm font-medium">Tesseract está extrayendo los datos mediante OCR</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1 flex items-center gap-2">
                <CheckCircle2 size={12} /> 1. Destino
              </label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full bg-[#020b14] border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-brand outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="">Seleccionar cuenta destino...</option>
                {accounts.filter(a => a.isActive).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <Info size={12} /> Sugerencia
              </label>
              <div className="bg-fin-bg/50 border border-fin-border rounded-2xl p-4 text-[11px] text-fin-muted italic">
                Sube capturas de pantalla o el PDF del resumen de Mercado Pago, Lemon, etc.
              </div>
            </div>
          </div>

          {/* Modo de importación y fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-fin-border/30">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted ml-1 flex items-center gap-2">
                <FileUp size={12} /> Modo de Importación
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('manual')}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'manual'
                    ? 'bg-brand text-fin-bg shadow-lg shadow-brand/20'
                    : 'bg-fin-bg border border-fin-border text-fin-muted hover:text-white'
                    }`}
                >
                  📱 Manual (Screenshot)
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('auto')}
                  className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${importMode === 'auto'
                    ? 'bg-brand text-fin-bg shadow-lg shadow-brand/20'
                    : 'bg-fin-bg border border-fin-border text-fin-muted hover:text-white'
                    }`}
                >
                  📄 Auto (PDF)
                </button>
              </div>
              <p className="text-[9px] text-fin-muted/60 ml-1">
                {importMode === 'manual'
                  ? 'Screenshots: Seleccioná la fecha manualmente'
                  : 'PDF estructurado: Las fechas se detectan automáticamente'}
              </p>
            </div>

            {importMode === 'manual' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand ml-1 flex items-center gap-2">
                  <CheckCircle2 size={12} /> Fecha de los Movimientos
                </label>
                <input
                  type="date"
                  value={importDate}
                  onChange={e => setImportDate(e.target.value)}
                  className="w-full bg-[#020b14] border border-brand/30 rounded-2xl p-4 text-white font-bold focus:border-brand outline-none transition-all"
                />
                <p className="text-[9px] text-fin-muted/60 ml-1">
                  Los movimientos se importarán con esta fecha
                </p>
              </div>
            )}
          </div>

          <div
            onClick={() => !isScanning && fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center gap-6 py-16 px-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${isScanning ? 'border-brand bg-brand/5' : 'border-fin-border hover:border-brand/40 hover:bg-brand/5'
              }`}
          >
            {/* Scanning Beam Animation */}
            {isScanning && <div className="absolute inset-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent animate-[scan_2s_linear_infinite] shadow-[0_0_15px_#3B82F6]"></div>}

            <div className="p-5 bg-brand/10 rounded-2xl text-brand group-hover:scale-110 transition-transform">
              <FileUp size={40} strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-white">{isScanning ? scanStatus : 'Subir Archivo'}</p>
              <p className="text-xs text-fin-muted font-medium mt-1">Imagen (PNG/JPG) o PDF de Mercado Pago</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-fin-muted">Contenido Detectado</label>
              <div className="flex gap-4">
                {rawText && (
                  <button
                    onClick={clearText}
                    className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> Limpiar
                  </button>
                )}
                <button
                  onClick={() => setRawText("02 de diciembre\n- $ 5.370 00\nPago a Carcor\n\n28 de noviembre\n+ $ 1.250 50\nIngreso de dinero")}
                  className="text-[9px] font-black text-brand uppercase tracking-widest hover:underline"
                >
                  Cargar ejemplo
                </button>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Pega texto directamente o sube una imagen..."
                className="w-full h-44 bg-[#020b14] border border-white/10 rounded-2xl p-5 text-xs text-white/70 font-mono focus:text-white focus:border-brand outline-none resize-none transition-all scrollbar-hide"
              />
              <FileText className="absolute bottom-5 right-5 text-white/10" size={20} />
            </div>
          </div>

          <button
            onClick={processText}
            disabled={!rawText || !selectedAccountId || isScanning}
            className="w-full bg-brand text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-hover disabled:opacity-20 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 group"
          >
            Analizar Movimientos <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => setStep(1)} className="p-3.5 bg-fin-card border border-fin-border rounded-2xl text-fin-muted hover:text-white transition-all shadow-lg">
            <ChevronLeft size={24} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Validación de Datos</h1>
            <p className="text-fin-muted text-xs font-bold uppercase tracking-widest mt-1">Revisa y categoriza antes de guardar</p>
          </div>
        </div>
        <button
          onClick={handleImport}
          disabled={isImporting || importedLines.filter(l => l.isSelected && l.categoryId).length === 0}
          className="w-full sm:w-auto bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <><Loader2 size={18} className="animate-spin" /> Importando...</>
          ) : (
            <><CheckCircle2 size={18} /> Importar ({importedLines.filter(l => l.isSelected).length})</>
          )}
        </button>
      </div>

      {/* Duplicate Warning Banner */}
      {importedLines.some(l => l.isDuplicate) && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4 animate-fade-in">
          <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Posibles duplicados detectados</p>
            <p className="text-xs text-amber-500/80 font-medium">Hemos desmarcado automáticamente los movimientos que ya parecen estar registrados.</p>
          </div>
        </div>
      )}

      <div className="bg-fin-card rounded-3xl border border-fin-border overflow-hidden shadow-2xl">
        {/* Datalist para sugerencias de descripciones basadas en historial */}
        <datalist id="description-suggestions">
          {[...new Set(existingTransactions.map(t => t.description))].slice(0, 50).map((desc, i) => (
            <option key={i} value={desc} />
          ))}
        </datalist>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-fin-bg/40 border-b border-fin-border">
              <tr className="text-[10px] text-fin-muted font-black uppercase tracking-widest">
                <th className="px-4 py-5 w-12 text-center">
                  <input type="checkbox" checked={importedLines.length > 0 && importedLines.every(l => l.isSelected)} onChange={e => setImportedLines(l => l.map(x => ({ ...x, isSelected: e.target.checked })))} className="w-5 h-5 rounded-lg border-fin-border bg-fin-bg text-brand focus:ring-brand accent-brand" />
                </th>
                <th className="px-4 py-5 w-28">Fecha</th>
                <th className="px-4 py-5 min-w-[200px]">Detalle</th>
                <th className="px-4 py-5 text-right w-36">Monto</th>
                <th className="px-4 py-5 w-40">Rubro</th>
                <th className="px-4 py-5 w-40">Sub-Rubro</th>
                <th className="px-4 py-5 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fin-border/30">
              {importedLines.map(line => (
                <tr key={line.id} className={`${line.isDuplicate ? 'bg-amber-500/5' : 'hover:bg-fin-bg/30'} transition-colors group ${!line.isSelected ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-4 text-center">
                    <input type="checkbox" checked={line.isSelected} onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, isSelected: e.target.checked } : l))} className="w-5 h-5 rounded-lg border-fin-border bg-fin-bg text-brand accent-brand cursor-pointer" />
                  </td>
                  <td className="px-4 py-4 font-bold text-white/50 tabular-nums text-xs whitespace-nowrap">{line.date}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <input
                        type="text"
                        list="description-suggestions"
                        value={line.description}
                        onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, description: e.target.value } : l))}
                        className="w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-brand px-1 py-0.5 text-[13px] font-bold text-white outline-none transition-all"
                        placeholder="Descripción..."
                      />
                      {line.isDuplicate && (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-2 py-0.5 rounded">
                          <AlertTriangle size={8} /> Ya registrado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-4 text-right font-black tabular-nums text-base ${line.type === 'IN' ? 'text-emerald-500' : 'text-white'}`}>
                    {line.type === 'IN' ? '+' : '-'}{formatCurrency(line.amount)}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="bg-[#020b14] border border-white/10 rounded-lg px-2 py-2 text-[10px] font-black text-white focus:border-brand outline-none w-full appearance-none cursor-pointer hover:border-brand/50 transition-all"
                      value={line.categoryId || ''}
                      onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, categoryId: e.target.value, subCategoryId: undefined } : l))}
                    >
                      <option value="">Rubro...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="bg-[#020b14] border border-white/10 rounded-lg px-2 py-2 text-[10px] font-black text-white focus:border-brand outline-none w-full appearance-none cursor-pointer hover:border-brand/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      value={line.subCategoryId || ''}
                      onChange={e => setImportedLines(lines => lines.map(l => l.id === line.id ? { ...l, subCategoryId: e.target.value } : l))}
                      disabled={!line.categoryId}
                    >
                      <option value="">Sub-rubro...</option>
                      {subCategories
                        .filter(s => s.categoryId === line.categoryId)
                        .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => setImportedLines(lines => lines.filter(l => l.id !== line.id))}
                      className="text-fin-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
