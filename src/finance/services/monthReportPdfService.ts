import { MonthReport } from '../financeTypes';
import { formatCurrency } from '../utils/calculations';

/**
 * monthReportPdfService — Genera un PDF profesional del reporte mensual.
 *
 * Usa jsPDF nativo (no html2canvas) para que el PDF tenga texto seleccionable,
 * peso bajo (~30 KB típico), saltos de página correctos y formato consistente.
 *
 * Una página típica + página adicional si los breakdowns son largos.
 *
 * Diseño: header con marca CEPHALOPOD, doc-code, datos de entidad, fecha.
 * Body con resumen ejecutivo (KPIs), comparativa MoM, breakdowns.
 * Footer con paginación y branding.
 */

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const buildDocCode = (entityName: string, month: number, year: number): string => {
  const prefix = entityName
    .split(' ')
    .map(w => w[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 3) || 'CPD';
  return `${prefix}-MR-${String(month + 1).padStart(2, '0')}-${year}`;
};

const fmtPct = (pct: number, sign = true): string => {
  if (!isFinite(pct)) return '—';
  const rounded = pct.toFixed(1);
  if (!sign) return `${rounded}%`;
  return pct >= 0 ? `+${rounded}%` : `${rounded}%`;
};

/**
 * Genera y dispara la descarga del PDF.
 * Carga jsPDF de forma dinámica para no inflar el bundle de la página.
 */
export const downloadMonthReportPdf = async (report: MonthReport): Promise<void> => {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ---- COLORES (RGB) ----
  const PHOSPHOR: [number, number, number] = [0, 200, 130];
  const TEXT_DARK: [number, number, number] = [30, 30, 30];
  const TEXT_MUTED: [number, number, number] = [110, 110, 110];
  const SUBTLE: [number, number, number] = [220, 220, 220];
  const POSITIVE: [number, number, number] = [0, 150, 100];
  const NEGATIVE: [number, number, number] = [200, 60, 60];

  const docCode = buildDocCode(report.entityName, report.month, report.year);
  const monthLabel = `${MONTHS[report.month]} ${report.year}`;
  const generatedDate = new Date(report.generatedAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Metadata del archivo
  doc.setProperties({
    title: `Reporte Mensual ${monthLabel} — ${report.entityName}`,
    subject: `${docCode} · Reporte Financiero`,
    author: 'Cephalopod · Sistemas que piensan.',
    keywords: 'finanzas, mensual, gastronomía, cephalopod',
    creator: 'Cephalopod FinanzaFlow',
  });

  let y = 0;
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN_X = 14;
  const CONTENT_W = PAGE_W - MARGIN_X * 2;

  // ---- HEADER ----
  const drawHeader = () => {
    // Banda phosphor superior
    doc.setFillColor(...PHOSPHOR);
    doc.rect(0, 0, PAGE_W, 3, 'F');

    y = 10;

    // Doc-code
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`— ${docCode}`, MARGIN_X, y);

    // Fecha de generación a la derecha
    doc.text(`Generado: ${generatedDate}`, PAGE_W - MARGIN_X, y, { align: 'right' });
    y += 6;

    // CEPHALOPOD wordmark
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...TEXT_DARK);
    doc.text('CEPHALOPOD', MARGIN_X, y);

    // Tagline a la derecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Sistemas que piensan.', PAGE_W - MARGIN_X, y, { align: 'right' });
    y += 8;

    // Línea divisoria
    doc.setDrawColor(...SUBTLE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
    y += 8;

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...TEXT_DARK);
    doc.text('Reporte Mensual', MARGIN_X, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`${report.entityName} · ${monthLabel}`, MARGIN_X, y);
    y += 10;
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const footerY = PAGE_H - 10;
    doc.setDrawColor(...SUBTLE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X, footerY - 4, PAGE_W - MARGIN_X, footerY - 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('Cephalopod · Inteligencia operativa para gastronomía.', MARGIN_X, footerY);
    doc.text(`Página ${pageNum} / ${totalPages}`, PAGE_W - MARGIN_X, footerY, { align: 'right' });
  };

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > PAGE_H - 20) {
      doc.addPage();
      drawHeader();
    }
  };

  drawHeader();

  // ---- KPI ROW (3 cajas) ----
  const drawKPI = (x: number, w: number, label: string, value: string, color: [number, number, number]) => {
    doc.setDrawColor(...SUBTLE);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, 22);

    // Banda lateral phosphor
    doc.setFillColor(...color);
    doc.rect(x, y, 1, 22, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(label.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...TEXT_DARK);
    doc.text(value, x + 4, y + 16);
  };

  const colW = (CONTENT_W - 6) / 3;
  drawKPI(MARGIN_X, colW, 'Ingresos', formatCurrency(report.totalIn), POSITIVE);
  drawKPI(MARGIN_X + colW + 3, colW, 'Egresos', formatCurrency(report.totalOut), NEGATIVE);
  drawKPI(
    MARGIN_X + (colW + 3) * 2,
    colW,
    'Balance Neto',
    formatCurrency(report.netBalance),
    report.netBalance >= 0 ? POSITIVE : NEGATIVE,
  );
  y += 28;

  // ---- SALDOS DE CAJA ----
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.text('Foto de Caja', MARGIN_X, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_DARK);
  doc.text(`Apertura del mes: ${formatCurrency(report.openingBalance)}`, MARGIN_X, y);
  y += 5;
  doc.text(`Cierre del mes:   ${formatCurrency(report.closingBalance)}`, MARGIN_X, y);
  y += 5;

  const cashDelta = report.closingBalance - report.openingBalance;
  doc.setTextColor(...(cashDelta >= 0 ? POSITIVE : NEGATIVE));
  doc.text(`Variación: ${formatCurrency(cashDelta)}`, MARGIN_X, y);
  y += 10;

  // ---- COMPARATIVA MoM ----
  if (report.comparison.prevMonth) {
    ensureSpace(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_DARK);
    doc.text('Comparativa vs Mes Anterior', MARGIN_X, y);
    y += 6;

    const c = report.comparison;
    const prev = c.prevMonth!;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const drawCompareLine = (label: string, current: number, prevVal: number, deltaPct: number) => {
      doc.setTextColor(...TEXT_DARK);
      doc.text(label, MARGIN_X, y);
      doc.text(formatCurrency(current), MARGIN_X + 60, y, { align: 'right' });
      doc.text(formatCurrency(prevVal), MARGIN_X + 100, y, { align: 'right' });
      doc.setTextColor(...(deltaPct >= 0 ? POSITIVE : NEGATIVE));
      doc.text(fmtPct(deltaPct), MARGIN_X + 130, y, { align: 'right' });
      doc.setTextColor(...TEXT_DARK);
      y += 5;
    };

    // Header tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('CONCEPTO', MARGIN_X, y);
    doc.text('ESTE MES', MARGIN_X + 60, y, { align: 'right' });
    doc.text('MES ANTERIOR', MARGIN_X + 100, y, { align: 'right' });
    doc.text('VARIACIÓN', MARGIN_X + 130, y, { align: 'right' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    drawCompareLine('Ingresos', report.totalIn, prev.totalIn, c.incomeDelta);
    drawCompareLine('Egresos', report.totalOut, prev.totalOut, c.expenseDelta);
    drawCompareLine('Balance', report.netBalance, prev.netBalance, prev.netBalance !== 0 ? (c.balanceDelta / Math.abs(prev.netBalance)) * 100 : 0);
    y += 4;
  }

  // ---- BREAKDOWN INGRESOS ----
  if (report.incomeBreakdown.length > 0) {
    ensureSpace(20 + report.incomeBreakdown.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_DARK);
    doc.text('Ingresos por Categoría', MARGIN_X, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('CATEGORÍA', MARGIN_X, y);
    doc.text('TX', MARGIN_X + 80, y, { align: 'right' });
    doc.text('MONTO', MARGIN_X + 130, y, { align: 'right' });
    doc.text('%', MARGIN_X + 160, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(...SUBTLE);
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);

    report.incomeBreakdown.forEach(b => {
      ensureSpace(6);
      doc.text(b.categoryName.slice(0, 50), MARGIN_X, y);
      doc.text(String(b.transactionCount), MARGIN_X + 80, y, { align: 'right' });
      doc.text(formatCurrency(b.amount), MARGIN_X + 130, y, { align: 'right' });
      doc.text(fmtPct(b.percentage, false), MARGIN_X + 160, y, { align: 'right' });
      y += 5;
    });
    y += 4;
  }

  // ---- BREAKDOWN EGRESOS ----
  if (report.expenseBreakdown.length > 0) {
    ensureSpace(20 + report.expenseBreakdown.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_DARK);
    doc.text('Egresos por Categoría', MARGIN_X, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('CATEGORÍA', MARGIN_X, y);
    doc.text('TX', MARGIN_X + 80, y, { align: 'right' });
    doc.text('MONTO', MARGIN_X + 130, y, { align: 'right' });
    doc.text('%', MARGIN_X + 160, y, { align: 'right' });
    y += 4;

    doc.setDrawColor(...SUBTLE);
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);

    report.expenseBreakdown.forEach(b => {
      ensureSpace(6);
      doc.text(b.categoryName.slice(0, 50), MARGIN_X, y);
      doc.text(String(b.transactionCount), MARGIN_X + 80, y, { align: 'right' });
      doc.text(formatCurrency(b.amount), MARGIN_X + 130, y, { align: 'right' });
      doc.text(fmtPct(b.percentage, false), MARGIN_X + 160, y, { align: 'right' });
      y += 5;
    });
  }

  // ---- FOOTER en todas las páginas ----
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // ---- DESCARGA ----
  const filename = `${docCode}_Reporte_Mensual.pdf`;
  doc.save(filename);
};
