import { ImportLine, TextCategoryRule, TransactionType } from "../financeTypes";
import { logger } from "../../services/logger";

/**
 * Parses raw text copied from an app screenshot or statement into structured data.
 * Optimized for Argentine Digital Wallets (MercadoPago) OCR output.
 */
export const parseRawText = (text: string): ImportLine[] => {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const result: ImportLine[] = [];

    // State for multiline parsing (dates apply to subsequent lines until a new date is found)
    let lastDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    // Spanish month mapping
    const months: { [key: string]: string } = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
        'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    };

    const cleanLine = (str: string) => {
        let s = str;
        // 1. Remove specific OCR noise tokens appearing at start (pe, i, Q, etc)
        //    But be careful NOT to remove "-" (negative sign)
        s = s.replace(/^(pe|i|Q|&|—|oO|fu\]|=>)\s+/i, '');

        // 2. Remove purely non-alphanumeric noise at start, but ALLOW +, -, $
        s = s.replace(/^[^a-zA-Z0-9\+\-\$]+/, '');

        return s.trim();
    };

    for (let i = 0; i < lines.length; i++) {
        let line = cleanLine(lines[i]);
        if (!line) continue;

        // --- A. DATE DETECTION ---
        // Patterns: "02 de diciembre", "28 de noviembre", "1 de diciembre Saldo..."
        const dateMatch = line.match(/^(\d{1,2})\s+(?:de\s+)?([a-zA-Z]+)/i);

        if (dateMatch) {
            const dayStr = dateMatch[1];
            const monthName = dateMatch[2].toLowerCase();

            if (months[monthName]) {
                const month = months[monthName];
                const day = dayStr.padStart(2, '0');

                // Year Heuristic
                let y = currentYear;
                const currentMonthNum = new Date().getMonth() + 1;
                if (parseInt(month) > currentMonthNum + 2) {
                    y = currentYear - 1;
                }
                lastDate = `${y}-${month}-${day}`;

                // Special Case: MP Header "1 de diciembre Saldo del día $..."
                // If the line contains "Saldo", we update the date but DO NOT process it as a transaction.
                if (line.toLowerCase().includes('saldo')) {
                    continue;
                }

                // If line ends with the date, we are done with this line.
                // If it has a $, it might be a compact line (Date + Amount), so we proceed.
                if (!line.includes('$')) continue;
            }
        }

        // --- B. AMOUNT DETECTION ---
        // We need to support two main formats:
        // 1. Standard: "+ $ 107,63" or "-$2.112,49"
        // 2. MP Spaces (Superscript cents): "$ 5.370 00" (Space before last 2 digits)

        // Regex explanation:
        // ([+\-])?       -> Optional Group 1: Sign (+ or -)
        // \s*\$\s*       -> $ symbol with optional spaces
        // (              -> Group 2: The Number
        //   [\d\.]+      -> Digits and dots (thousands separators)
        //   (?:,| )      -> Separator: Comma OR Space (for the MP weird format)
        //   \d{2}        -> Exactly 2 digits (cents)
        // )
        const amountRegex = /([+\-])?\s*\$\s*([\d\.]+(?:,| )\d{2})\b/;
        const amountMatch = line.match(amountRegex);

        if (amountMatch) {
            let signStr = amountMatch[1]; // + or - or undefined
            let valueStr = amountMatch[2];

            // Fix format: Remove dots, replace space/comma with dot for parsing
            // If format is "5.370 00" -> remove dot -> "5370 00" -> replace space with dot -> "5370.00"
            valueStr = valueStr.replace(/\./g, ''); // Remove thousands dots
            valueStr = valueStr.replace(' ', '.');  // Replace space separator with dot
            valueStr = valueStr.replace(',', '.');  // Replace comma separator with dot

            const amount = parseFloat(valueStr);

            // Inference for Description & Type
            let description = line.replace(amountMatch[0], '').trim(); // Remove the amount part

            // If sign is missing, try to infer from text
            if (!signStr) {
                const lowerDesc = description.toLowerCase();
                if (lowerDesc.includes('pago') || lowerDesc.includes('compra') || lowerDesc.includes('transferencia')) {
                    signStr = '-';
                } else if (lowerDesc.includes('rendimiento') || lowerDesc.includes('ingreso') || lowerDesc.includes('recib')) {
                    signStr = '+';
                } else {
                    // Default to OUT if unknown, usually safe for wallet logs
                    signStr = '-';
                }
            }

            const type = signStr === '+' ? TransactionType.IN : TransactionType.OUT;

            // --- MULTILINE DESCRIPTION LOGIC ---
            const genericTerms = ['pago con tarjeta', 'transferencia', 'pago a', 'pago', 'compra', 'debit', 'débito', 'rendimiento diario', 'ingreso de dinero'];
            const isGeneric = genericTerms.some(t => description.toLowerCase().includes(t)) || description.length < 3;

            // Look ahead to next lines for details if current description is poor
            if (i + 1 < lines.length) {
                const nextLineRaw = lines[i + 1];
                const nextLine = cleanLine(nextLineRaw);

                // Verify next line is NOT a date and NOT an amount
                const isNextDate = /^(\d{1,2})\s+(?:de\s+)?([a-zA-Z]+)/i.test(nextLine);
                const isNextAmount = amountRegex.test(nextLine);

                if (!isNextDate && !isNextAmount && nextLine.length > 2) {
                    if (isGeneric) {
                        // Replace generic description with specific detail
                        // e.g. "Pago con tarjeta" -> "Amazon Music" (from next line "En Dlo*amazon Music")
                        let detail = nextLine.replace(/^En\s+/i, ''); // Clean "En "
                        description = detail;
                    } else {
                        // Append detail
                        description += " " + nextLine;
                    }
                    i++; // Skip next line in main loop
                }
            }

            // Cleanup description
            description = description.replace(/^-\s*/, '').replace(/^\+\s*/, '').trim(); // Remove leading signs that might have been left
            if (description.length < 2) description = type === TransactionType.IN ? "Ingreso detectado" : "Gasto detectado";

            result.push({
                id: crypto.randomUUID(),
                rawText: line,
                date: lastDate,
                description: description,
                amount: amount,
                type: type,
                isSelected: true,
                isDuplicate: false
            });
        }
    }

    return result;
};

/**
 * Parser específico para el resumen PDF de Mercado Pago.
 * Formato típico del PDF:
 * "Fecha Descripción ID de la operación Valor Saldo"
 * "01-01-2026 Pago Google 139632256637 $ -37.866,12 $ 342.235,94"
 */
export const parseMercadoPagoPDF = (text: string): ImportLine[] => {
    const result: ImportLine[] = [];

    // Regex para detectar líneas de transacciones de MP
    // Soporta formatos de fecha: DD-MM-YYYY, DD MM YYYY, DD.MM.YYYY (con o sin cero inicial)
    // Formato: FECHA Descripción ID $ Monto $ Saldo
    const transactionRegex = /(\d{1,2}[\s\-\.]+\d{1,2}[\s\-\.]+\d{4})\s+(.+?)\s+(\d{10,})\s+\$\s*([\-\d\.,]+)\s+\$\s*([\d\.,]+)/g;

    let match;

    while ((match = transactionRegex.exec(text)) !== null) {
        const [, dateStr, description, , valueStr] = match;

        // Normalizar fecha: separar por guiones, espacios o puntos
        const dateParts = dateStr.split(/[\s\-\.]+/);
        if (dateParts.length !== 3) continue;
        const day = dateParts[0].padStart(2, '0');
        const month = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        const formattedDate = `${year}-${month}-${day}`;

        // Parsear el valor (quitar puntos de miles y convertir coma a punto)
        const cleanValue = valueStr.replace(/\./g, '').replace(',', '.');
        let amount = parseFloat(cleanValue);

        // Determinar tipo (IN/OUT) basado en el signo
        const type = amount < 0 ? TransactionType.OUT : TransactionType.IN;
        amount = Math.abs(amount);

        // Limpiar descripción
        const cleanDesc = description.trim().replace(/\s+/g, ' ');

        result.push({
            id: crypto.randomUUID(),
            rawText: match[0],
            date: formattedDate,
            description: cleanDesc,
            amount: amount,
            type: type,
            isSelected: true,
            isDuplicate: false
        });
    }

    return result;
};

/**
 * Detector de capturas de pantalla de Naranja X mobile app.
 * Tolerante a typos de OCR (fuzzy markers).
 */
const isNaranjaXScreenshot = (text: string): boolean => {
    let score = 0;
    // Markers fuertes con tolerancia a OCR (.{0,2} permite hasta 2 chars de error)
    if (/tar[jiltf]eta\s*nara[njil]+\w*\s*x/i.test(text)) score += 3;
    if (/nara[njil]+a\s*x/i.test(text)) score += 2;
    if (/pago\s*de\s*resu[mn]e?n/i.test(text)) score += 2;
    if (/ren?d[il]m[il]ento\s*d[il]ar[il]o/i.test(text)) score += 2;
    if (/cre[aoá]c[il][oó]n\s*de\s*frasco/i.test(text)) score += 2;
    if (/acred[il]tac[il][oó]n\s*de\s*frasco/i.test(text)) score += 2;
    if (/pago\s*con\s*tar[jiltf]eta\s*de\s*d[eé]b[il]to/i.test(text)) score += 2;
    if (/perc\.?\s*rg/i.test(text)) score += 1;
    if (/galicia\s*seg/i.test(text)) score += 1;
    if (/transferenc[il]a\s*rec[il]b[il]da/i.test(text)) score += 1;
    if (/dlo\*?amazon/i.test(text)) score += 1;
    // Mercado Pago tiene markers específicos que pesan en contra
    if (/resumen\s*de\s*cuenta/i.test(text)) score -= 5;
    if (/detalle\s*de\s*movimientos/i.test(text)) score -= 5;
    return score >= 2; // Threshold bajado de 3 → 2 para mayor cobertura
};

/**
 * Parser específico para capturas de pantalla de Naranja X mobile app.
 *
 * Formato típico (después del OCR) — bloques de 3 líneas por movimiento:
 *   [día] de [mes]
 *   [descripción] (a veces "subtítulo" en línea siguiente)
 *   [+/-] $ [monto]
 *
 * Ruido de OCR a limpiar (íconos a la izquierda interpretados como chars):
 *   - "l Rendimiento diario" → "Rendimiento diario"
 *   - "a 27 de abril" → "27 de abril"
 *   - "2 23 de abril" → "23 de abril"
 *   - "Eo e." / "e Ln" → líneas de garbage puro a descartar
 */
export const parseNaranjaXScreenshot = (text: string): ImportLine[] => {
    const result: ImportLine[] = [];
    const months: Record<string, string> = {
        enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
        julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12'
    };
    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1;

    // Limpieza agresiva de prefijos de ícono OCR.
    // ORDEN IMPORTA: primero trim + non-alnum strip, después prefijo 1-3 chars.
    const cleanLine = (str: string): string => {
        let s = str.trim();
        // 1. Strip non-alphanumeric noise al inicio (preserva +, -, $)
        s = s.replace(/^[^a-zA-Z0-9\+\-\$]+/, '');
        // 2. Strip prefijos de 1-3 chars (letras, dígitos, pipes, slashes) +
        //    espacio antes de letra mayúscula. Cubre "l Rendimiento",
        //    "1 Pago", "I Pago", "ll Pago", "|/ Transfer"
        s = s.replace(/^[a-zA-Z0-9|\\\/]{1,3}\s+(?=[A-ZÁÉÍÓÚa-záéíóú]{4,})/, '');
        // 3. Strip prefijos antes de "X de mes" o número
        s = s.replace(/^[a-zA-Z0-9|\\\/]{1,2}\s+(?=\d{1,2}\s+de\s+[a-z])/i, '');
        s = s.replace(/^[a-zA-Z0-9|\\\/]\s+(?=\d)/, '');
        return s.trim();
    };

    // Descriptors canónicos de Naranja X con patterns LENIENTES.
    // Acepta versiones parciales/truncadas/concatenadas que OCR puede generar.
    // Estrategia: matchear las raíces clave de cada concepto (tarjeta, frasco,
    // resumen, etc.), no requerir la forma completa con todas las palabras.
    const NX_DESCRIPTORS = [
        { canonical: 'Rendimiento diario',         fuzzy: /re?nd[il]m[il]e?n?to/i },
        { canonical: 'Pago con tarjeta de débito', fuzzy: /pago.{0,15}tar[jiltf]eta/i },
        { canonical: 'Pago de resumen',            fuzzy: /pago.{0,5}de.{0,5}resu[mn]/i },
        { canonical: 'Creación de frasco',         fuzzy: /cre[aoá].{0,5}c?[il]?[oó]n.{0,5}(de\s*)?frasco/i },
        { canonical: 'Acreditación de frasco',     fuzzy: /acred[il]ta.{0,5}c?[il]?[oó]n.{0,5}(de\s*)?frasco/i },
        { canonical: 'Rendimiento de frasco fijo', fuzzy: /rend[il]m[il]ento.{0,5}(de\s*)?frasco/i },
        { canonical: 'Transferencia recibida',     fuzzy: /transferenc[il]a.{0,5}rec[il]b/i },
        { canonical: 'Transferencia enviada',      fuzzy: /transferenc[il]a.{0,5}env[il]/i },
        { canonical: 'PERC. RG 5617 ARCA',         fuzzy: /perc.{0,5}rg.{0,5}\d+/i },
    ];
    const normalizeDescriptor = (text: string): string => {
        for (const { canonical, fuzzy } of NX_DESCRIPTORS) {
            if (fuzzy.test(text)) return canonical;
        }
        return text;
    };

    const isJunkLine = (s: string): boolean => {
        // Líneas muy cortas sin $ ni dígitos
        if (s.length < 4 && !/[\$\d]/.test(s)) return true;
        // Líneas <8 chars con baja densidad alfabética
        // ("Eo e.", "e Ln", "fu]" — íconos OCR mal capturados)
        if (s.length < 10 && !/\$/.test(s) && !/\d{1,2}\s+de\s+/i.test(s)) {
            const words = s.split(/\s+/).filter(w => w.length > 0);
            const longestWordLetters = Math.max(0, ...words.map(w => (w.match(/[a-zA-Záéíóúñ]/gi) || []).length));
            // Si la palabra más larga tiene <4 letras alfabéticas, es garbage
            if (longestWordLetters < 4) return true;
        }
        return false;
    };

    const lines = text.split('\n').map(cleanLine).filter(l => l && !isJunkLine(l));

    // Procesamos en bloques: buscar [fecha] [desc...] [monto]
    let currentDate: string | null = null;
    let descBuffer: string[] = [];

    const flushTransaction = (sign: string, valueStr: string) => {
        // valueStr: "2.112,49" o "0,85"
        const cleanValue = valueStr.replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(cleanValue);
        if (isNaN(amount) || amount <= 0) return;
        // Si OCR no detecto la fecha, usamos hoy como fallback (usuario corrige manual).
        const dateForRow = currentDate || new Date().toISOString().split('T')[0];

        // Strip "En " y normalizar cada parte a descriptor canónico
        const cleanedParts = descBuffer
            .map(p => p.replace(/^En\s+/i, '').trim())
            .filter(p => p.length > 0)
            .map(p => normalizeDescriptor(p));
        // Dedup por si el mismo descriptor aparece dos veces concatenado
        const uniqueParts = [...new Set(cleanedParts)];
        let description = uniqueParts.join(' · ').trim();
        if (description.length < 3) {
            description = sign === '+' ? 'Ingreso Naranja X' : 'Egreso Naranja X';
        }

        const type = sign === '+' ? TransactionType.IN : TransactionType.OUT;
        result.push({
            id: crypto.randomUUID(),
            rawText: descBuffer.join(' / ') + ' ' + sign + valueStr,
            date: dateForRow,
            description,
            amount,
            type,
            isSelected: true,
            isDuplicate: false,
        });
        descBuffer = [];
    };

    // Patrones de fecha SOLO con nombre de mes (NX usa palabras, no formato numérico).
    // Removido el patrón "26/04" porque matcheaba false-positives como "02-11" en
    // medio de descripciones (códigos de comercio, transacciones de tarjeta, etc.)
    const datePatterns = [
        /(\d{1,2})\s+de\s+([a-zA-Záéíóúñ]{3,})/i,    // "26 de abril"
        /(\d{1,2})\s+([a-zA-Záéíóúñ]{4,})/i,         // "26 abril" (sin "de")
        /(\d{1,2})[\/\.\-]([a-zA-Záéíóúñ]{3,})/i,    // "26/abril", "26-abril"
    ];
    // Amount: + o - opcional, espacios opcionales, $, número con separadores
    // flexibles. Permite "$ 2.112,49", "$2,112.49", "$ 2 112,49", "$2.112,49"
    const amountRegex = /([+\-])?\s*\$\s*([\d][\d\.\s,]*[\.,]\d{2})/;
    const amountInlineRegex = /([+\-])\s*\$\s*([\d][\d\.\s,]*[\.,]\d{2})/;

    const tryParseDate = (line: string): { date: string; lineWithoutDate: string } | null => {
        for (const pat of datePatterns) {
            const m = line.match(pat);
            if (!m) continue;
            const dayStr = m[1];
            const monthRaw = m[2];
            let month: string | undefined;
            if (/^\d+$/.test(monthRaw)) {
                month = monthRaw.padStart(2, '0');
            } else {
                const monthKey = monthRaw.toLowerCase().replace(/[^a-záéíóúñ]/g, '');
                // Fuzzy match — primer mes que comparte primeros 3 chars
                const found = Object.keys(months).find(k =>
                    k === monthKey || k.startsWith(monthKey.slice(0, 3)) || monthKey.startsWith(k.slice(0, 3))
                );
                if (found) month = months[found];
            }
            if (!month) continue;
            const day = dayStr.padStart(2, '0');
            let y = currentYear;
            if (parseInt(month) > currentMonthNum + 2) y = currentYear - 1;
            return {
                date: `${y}-${month}-${day}`,
                lineWithoutDate: line.replace(m[0], '').trim(),
            };
        }
        return null;
    };

    for (const line of lines) {
        // 1. ¿La línea contiene una fecha? (puede estar al inicio O acompañada de texto)
        const dateInfo = tryParseDate(line);
        if (dateInfo) {
            // Antes de cambiar fecha: si el buffer tiene desc pendiente con currentDate,
            // no flusheamos sin amount (esperamos el amount).
            currentDate = dateInfo.date;
            descBuffer = [];
            // Si la línea tenía MÁS contenido después de la fecha, procesarlo
            const remainder = dateInfo.lineWithoutDate;
            if (remainder.length >= 3) {
                // ¿El resto contiene un amount inline?
                const inline = remainder.match(amountInlineRegex);
                if (inline) {
                    const desc = remainder.replace(inline[0], '').trim();
                    if (desc) descBuffer.push(desc);
                    flushTransaction(inline[1] || (remainder.includes('-') ? '-' : '+'), inline[2]);
                } else {
                    // Solo descripción → al buffer
                    descBuffer.push(remainder);
                }
            }
            continue;
        }

        // 2. ¿Es un monto puro o con texto?
        const amountMatch = line.match(amountRegex);
        if (amountMatch && currentDate) {
            const sign = amountMatch[1] || (line.includes('-') ? '-' : '+');
            // Texto antes/después del amount es descripción adicional
            const desc = line.replace(amountMatch[0], '').trim();
            if (desc && desc.length >= 3) descBuffer.push(desc);
            flushTransaction(sign, amountMatch[2]);
            continue;
        }

        // 3. Es descripción pura → al buffer si tenemos fecha
        if (currentDate && line.length >= 3 && !line.match(/^[\d\.,$\s\-\+]+$/)) {
            descBuffer.push(line);
        }
    }

    return result;
};

// ============================================================
// NARANJA X — PDF CAJA DE AHORRO (resumen mensual)
// ============================================================

const NX_CAJA_MONTHS: Record<string, string> = {
    'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AGO': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12',
};

/** Detecta el PDF de Caja de Ahorro Naranja X por sus marcas características. */
const isNaranjaXCajaAhorroPDF = (text: string): boolean => {
    const hasMovHeader = /Movimientos del mes de tu cuenta/i.test(text);
    const hasNaranjaDigital = /Naranja Digital|naranja\s*x/i.test(text);
    const hasFrascoOrRendimiento =
        /rendimiento diario|acreditación de frasco|creación de frasco/i.test(text);
    // Pide al menos 2 marcadores para evitar falsos positivos.
    return [hasMovHeader, hasNaranjaDigital, hasFrascoOrRendimiento].filter(Boolean).length >= 2;
};

/** Convierte "$ 1.234,56" o "1.234,56" o "$1234.56" a número positivo. */
const nxParseAmount = (raw: string): number => {
    if (!raw) return 0;
    const cleaned = raw.replace(/[\s$]/g, '');
    if (!cleaned) return 0;
    // Manejar formatos: argentino (1.234,56) o latino con puntos como separador miles
    if (/,\d{1,2}$/.test(cleaned)) {
        // Coma decimal: quitar puntos como separadores de miles
        return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // Sin coma decimal: parsear tal cual
    return parseFloat(cleaned.replace(/[^\d.\-]/g, '')) || 0;
};

/**
 * Parsea el PDF de Caja de Ahorro Naranja X (mensual).
 *
 * Estructura de cada línea de movimiento:
 *   DD/MES  Nº_operación  Descripción  $Ingreso  $Egreso  $Saldo
 *
 * Reglas:
 *  - El año no aparece explícito → se asume el año actual. (El usuario puede
 *    ajustar la fecha al cargar si fuera de otro año.)
 *  - Se detecta IN/OUT por el delta del Saldo respecto al saldo previo.
 *  - Se ignora la línea "Dinero inicial" / "Dinero final" / "Acreditación de
 *    frasco fijo" (movimientos internos de cuenta a frasco, no son gastos).
 *  - Descripciones multilínea (ej: "Transferencia recibida VITALE, NICOLAS")
 *    se reconstruyen uniendo líneas hasta la próxima fecha o monto.
 */
export const parseNaranjaXCajaAhorroPDF = (text: string): ImportLine[] => {
    const out: ImportLine[] = [];
    const currentYear = new Date().getFullYear();

    // Recortar la sección útil: desde la primera "Movimientos del mes de tu cuenta"
    // hasta el primer "Dinero final" (excluyente).
    const start = text.indexOf('Movimientos del mes de tu cuenta');
    const sliced = start >= 0 ? text.slice(start) : text;
    const endMatch = sliced.search(/\bDinero final\b/);
    const block = endMatch >= 0 ? sliced.slice(0, endMatch) : sliced;

    // Patrón fecha-operacion: "06/MAY 12268222568"
    const lineRe = /(\d{2})\/(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(\d{8,})\s+([^\n]+?)\s+\$\s*([\-\d.,]+)(?:\s+\$\s*([\-\d.,]+))?\s+\$\s*([\-\d.,]+)/gi;

    let prevBalance: number | null = null;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(block)) !== null) {
        const day = m[1];
        const monthAbbr = m[2].toUpperCase();
        const opNumber = m[3];
        const rawDesc = (m[4] || '').replace(/\s+/g, ' ').trim();
        // m[5] y m[6] son los dos primeros montos (Ingreso, Egreso) — alguno puede faltar
        // m[7] es el saldo.
        const a1 = nxParseAmount(m[5] || '');
        const a2 = nxParseAmount(m[6] || '');
        const saldo = nxParseAmount(m[7] || '');
        const mm = NX_CAJA_MONTHS[monthAbbr];
        if (!mm) continue;
        const date = `${currentYear}-${mm}-${day.padStart(2, '0')}`;

        // Saltar movimientos internos cuenta ↔ frasco (no son gastos ni ingresos reales).
        if (/acreditaci[oó]n de frasco|creaci[oó]n de frasco|rendimiento de frasco/i.test(rawDesc)) {
            prevBalance = saldo;
            continue;
        }
        // Saltar transferencias entre cuentas del mismo titular (auto-transferencias).
        if (/transferencia (enviada|recibida)\s+(VITALE|NICOLAS\s+ABEL\s+LUIS\s+VITA)/i.test(rawDesc)) {
            prevBalance = saldo;
            continue;
        }

        // Determinar IN/OUT por delta del saldo si tenemos saldo previo,
        // sino usar heurística de "qué monto vino primero".
        let type: TransactionType;
        let amount = 0;
        if (prevBalance !== null) {
            const delta = saldo - prevBalance;
            if (delta >= 0) {
                type = TransactionType.IN;
                amount = a1 > 0 ? a1 : a2;
            } else {
                type = TransactionType.OUT;
                // El monto OUT puede estar en m[5] (si el PDF lo puso ahí) o m[6].
                amount = a2 > 0 ? a2 : a1;
            }
            // Si el monto no se detectó bien, usar |delta|.
            if (amount === 0) amount = Math.abs(delta);
        } else {
            // Primer movimiento: si solo viene un monto, asumir IN si va al saldo positivo.
            amount = a1 > 0 ? a1 : a2;
            type = saldo >= 0 ? TransactionType.IN : TransactionType.OUT;
        }

        prevBalance = saldo;

        if (!amount || amount < 0.01) continue;

        out.push({
            id: `nxcaja-${opNumber}`,
            rawText: `${day}/${monthAbbr} ${opNumber} ${rawDesc} ${m[7]}`,
            date,
            description: rawDesc,
            amount: Math.abs(amount),
            type,
            isSelected: true,
            isDuplicate: false,
        });
    }

    return out;
};

// ============================================================
// SUPERVIELLE — PDF de movimientos de cuenta
// ============================================================

/** Detecta el PDF del Banco Supervielle por sus marcas características. */
const isSupervielleAccountPDF = (text: string): boolean => {
    const hasSupervielle = /SUPERVIELLE/i.test(text);
    const hasDebinOrConceptoQB = /CONCEPTO_QB|TIPO_DEBIN|ID_DEBIN/i.test(text);
    const hasFechaHeader = /Fecha\s+Concepto\s+Detalle/i.test(text) ||
        /Remuneración\s+de\s+Saldo/i.test(text);
    return [hasSupervielle, hasDebinOrConceptoQB, hasFechaHeader].filter(Boolean).length >= 2;
};

/** Extrae el NOMBRE del detalle Supervielle (puede ir antes o después del CBU). */
const supExtractName = (detail: string): string | null => {
    const m = detail.match(/NOMBRE:\s+(.+?)(?=\s+CBU:|\s+MOTIVO:|\s+\d{1,3}(?:\.\d{3})*,\d{2}|$)/i);
    return m ? m[1].trim().replace(/\s+/g, ' ') : null;
};

const supParseAmount = (raw: string): number => {
    if (!raw) return 0;
    return parseFloat(raw.replace(/\./g, '').replace(',', '.')) || 0;
};

/**
 * Parser del PDF de movimientos de cuenta Supervielle.
 * Estructura por movimiento:
 *   YYYY/MM/DD HH:MM <Concepto> <Detalle con CONCEPTO_QB, LEYENDA, NOMBRE, CBU>
 *   <Débito> <Crédito> <Saldo>
 *
 * Reglas:
 * - Filtra: 'Remuneración de Saldo', 'Intereses pagados' (renta del banco,
 *   ruido para presupuesto), auto-transferencias al propio titular
 *   (NOMBRE VITALE NICOLAS ABEL LUIS).
 * - Mantiene: Pago de Sueldo (IN), Debito DEBIN no-auto (OUT),
 *   Transferencias por CBU a terceros (OUT). Extrae el nombre del
 *   comercio/destinatario para usar como descripción legible.
 * - Año viene en la fecha (YYYY/MM/DD), no se asume.
 * - IN/OUT por concepto (DEBIN/Transferencia enviada = OUT, Sueldo = IN).
 */
export const parseSupervielleAccountPDF = (text: string): ImportLine[] => {
    const out: ImportLine[] = [];

    // Aplanar saltos de línea para que cada movimiento sea una "línea lógica".
    const flat = text.replace(/\s+/g, ' ');

    // Bloque = fecha+hora + todo hasta antes del próximo encabezado de fecha.
    const blockRe = /(\d{4}\/\d{2}\/\d{2})\s+(\d{2}:\d{2})\s+(.+?)(?=\s+\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}|$)/g;
    const moneyRe = /([0-9](?:[0-9.]*),[0-9]{2})/g;

    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(flat)) !== null) {
        const rawDate = m[1]; // YYYY/MM/DD
        const date = rawDate.replace(/\//g, '-'); // YYYY-MM-DD
        const rest = m[3].trim();

        if (/^Remuneración de Saldo\b|^Intereses pagados\b/i.test(rest)) continue;
        if (/NOMBRE:\s+VITALE\s+NICOLAS\s+ABEL\s+LUIS/i.test(rest)) continue;

        const amts = [...rest.matchAll(moneyRe)].map(a => a[1]);
        if (amts.length < 2) continue;
        const monto = supParseAmount(amts[amts.length - 2]);
        if (monto < 0.01) continue;

        let type: TransactionType = TransactionType.OUT;
        if (/Pago de Sueldo/i.test(rest)) type = TransactionType.IN;

        const name = supExtractName(rest);
        let desc: string;
        if (/Pago de Sueldo/i.test(rest)) {
            desc = 'Pago de Sueldo';
        } else if (name) {
            if (/Pago con QR/i.test(rest)) desc = `QR · ${name}`;
            else if (/Transferencia enviada/i.test(rest)) desc = `Transferencia a ${name}`;
            else desc = name;
        } else {
            desc = rest.split(/\s+/).slice(0, 5).join(' ');
        }

        out.push({
            id: `sup-${date}-${out.length}`,
            rawText: `${rawDate} ${m[2]} ${rest.slice(0, 80)}`,
            date,
            description: desc,
            amount: monto,
            type,
            isSelected: true,
            isDuplicate: false,
        });
    }

    return out;
};

/**
 * Función principal que detecta el formato y usa el parser apropiado.
 */
export const parseImportText = (text: string): ImportLine[] => {
    // 1. PDF Supervielle
    if (isSupervielleAccountPDF(text)) {
        const supResults = parseSupervielleAccountPDF(text);
        if (supResults.length > 0) {
            logger.debug('Supervielle PDF detectado', { context: 'ImportEngine', data: { count: supResults.length } });
            return supResults;
        }
    }

    // 2. PDF Caja de Ahorro Naranja X (mensual)
    if (isNaranjaXCajaAhorroPDF(text)) {
        const nxCajaResults = parseNaranjaXCajaAhorroPDF(text);
        if (nxCajaResults.length > 0) {
            logger.debug('Naranja X Caja de Ahorro PDF detectado', { context: 'ImportEngine', data: { count: nxCajaResults.length } });
            return nxCajaResults;
        }
    }

    // 2. Capturas de Naranja X tarjeta (mobile screenshots)
    if (isNaranjaXScreenshot(text)) {
        const nxResults = parseNaranjaXScreenshot(text);
        if (nxResults.length > 0) {
            logger.debug('Naranja X screenshot detectado', { context: 'ImportEngine', data: { count: nxResults.length } });
            return nxResults;
        }
    }

    // 3. PDF de Mercado Pago
    const isMercadoPagoPDF = text.includes('RESUMEN DE CUENTA') ||
        text.includes('mercado pago') ||
        text.includes('DETALLE DE MOVIMIENTOS') ||
        /\d{1,2}[\s\-\.]+\d{1,2}[\s\-\.]+\d{4}.*\$\s*[\-\d\.,]+\s+\$\s*[\d\.,]+/.test(text);

    if (isMercadoPagoPDF) {
        const mpResults = parseMercadoPagoPDF(text);
        if (mpResults.length > 0) {
            return mpResults;
        }
    }

    // 4. Fallback al parser genérico (capturas de Mercado Pago mobile, Lemon, etc.)
    return parseRawText(text);
};

/**
 * Applies learned rules to categorize imported lines.
 * Las reglas se ordenan por priority DESC defensivamente para que el caller no
 * pueda romper el matching si pasa el array sin ordenar (getRules ya ordena).
 */
export const applyRules = (lines: ImportLine[], rules: TextCategoryRule[]): ImportLine[] => {
    logger.debug('Applying rules', { context: 'ImportEngine', data: { rulesCount: rules.length, linesCount: lines.length } });

    const sortedRules = [...rules].sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));

    return lines.map(line => {
        const match = sortedRules.find(r => {
            if (!r.isActive) return false;
            const text = line.description.toLowerCase();
            const pattern = r.pattern.toLowerCase();

            // Default to 'contains' if matchType is not defined
            const matchType = r.matchType || 'contains';

            if (matchType === 'contains') return text.includes(pattern);
            if (matchType === 'equals') return text === pattern;
            if (matchType === 'startsWith') return text.startsWith(pattern);

            // Fallback: try contains
            return text.includes(pattern);
        });

        if (match) {
            logger.debug('Rule match found', { context: 'ImportEngine', data: { desc: line.description, pattern: match.pattern, categoryId: match.categoryId } });
            return {
                ...line,
                categoryId: match.categoryId,
                subCategoryId: match.subCategoryId,
                type: match.direction || line.type
            };
        }

        return line;
    });
};