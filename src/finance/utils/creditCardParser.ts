/**
 * Parser de Resúmenes de Tarjeta de Crédito
 * Soporta: Naranja X (y extensible a otros)
 */

export interface CreditCardLine {
    date: string; // YYYY-MM-DD
    description: string;
    currentInstallment?: number; // Cuota actual (ej: 2)
    totalInstallments?: number; // Total cuotas (ej: 12)
    amount: number; // Monto de esta cuota
    originalAmount?: number; // Monto total de la compra original
}

export interface CreditCardStatement {
    cardHolder: string;
    cardType: string; // "Naranja X", "Visa", etc.
    statementDate: string; // Fecha del resumen
    dueDate: string; // Fecha de vencimiento
    totalAmount: number; // Total a pagar
    lines: CreditCardLine[];
    futureInstallments: CreditCardLine[]; // Cuotas proyectadas para meses futuros
}

/**
 * Parsea texto extraído de un resumen de Naranja X
 * El formato esperado es:
 * FECHA    TARJETA    CUPON  DETALLE    CUOTA/PLAN    $    U$S
 * 17/11/25 NX Virtual 64     CEFIROGAS  02/12         114.501,58
 */
export function parseNaranjaXStatement(text: string): CreditCardStatement | null {
    try {
        const lines: CreditCardLine[] = [];
        const futureInstallments: CreditCardLine[] = [];

        // Buscar nombre del titular
        const holderMatch = text.match(/Consumos tarjeta de crédito de (.+?)(?:\r?\n|$)/i);
        const cardHolder = holderMatch ? holderMatch[1].trim() : 'Titular Desconocido';

        // Buscar total
        const totalMatch = text.match(/Total\s*\$?\s*([\d.,]+)/i);
        const totalAmount = totalMatch ? parseArgNumber(totalMatch[1]) : 0;

        // Buscar fecha de vencimiento (normalmente en "Fechas importantes")
        const dueDateMatch = text.match(/vencimiento.+?(\d{2}\/\d{2})/i);
        const dueDate = dueDateMatch ? formatDateFromDDMM(dueDateMatch[1]) : '';

        // Parsear líneas de consumo
        // Patrón: FECHA TARJETA CUPON DETALLE CUOTA/PLAN MONTO
        const lineRegex = /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+(\d+)\s+(.+?)\s+(?:(\d{2})\/(\d{2}))?\s+([\d.,]+)/g;

        let match;
        while ((match = lineRegex.exec(text)) !== null) {
            const [, dateStr, , , description, currentStr, totalStr, amountStr] = match;

            const current = currentStr ? parseInt(currentStr) : undefined;
            const total = totalStr ? parseInt(totalStr) : undefined;
            const amount = parseArgNumber(amountStr);

            lines.push({
                date: formatDateFromDDMMYY(dateStr),
                description: description.trim(),
                currentInstallment: current,
                totalInstallments: total,
                amount,
                originalAmount: current && total ? (amount * total) : undefined
            });

            // Si hay cuotas futuras, proyectarlas
            if (current && total && current < total) {
                for (let i = current + 1; i <= total; i++) {
                    futureInstallments.push({
                        date: getNextMonthDate(dateStr, i - current),
                        description: `${description.trim()} (Cuota ${i}/${total})`,
                        currentInstallment: i,
                        totalInstallments: total,
                        amount
                    });
                }
            }
        }

        // Si no encontramos líneas con el regex principal, intentar otro patrón
        if (lines.length === 0) {
            // Patrón alternativo: línea por línea
            const textLines = text.split('\n');
            for (const line of textLines) {
                const simpleMatch = line.match(/(\d{2}\/\d{2}\/\d{2})\s+.+\s+(\d{2})\/(\d{2})\s+([\d.,]+)/);
                if (simpleMatch) {
                    const [, dateStr, currentStr, totalStr, amountStr] = simpleMatch;
                    const descMatch = line.match(/\d{4}\s+(.+?)\s+\d{2}\/\d{2}/);

                    lines.push({
                        date: formatDateFromDDMMYY(dateStr),
                        description: descMatch ? descMatch[1].trim() : 'Consumo',
                        currentInstallment: parseInt(currentStr),
                        totalInstallments: parseInt(totalStr),
                        amount: parseArgNumber(amountStr)
                    });
                }
            }
        }

        return {
            cardHolder,
            cardType: 'Naranja X',
            statementDate: new Date().toISOString().split('T')[0],
            dueDate,
            totalAmount,
            lines,
            futureInstallments
        };
    } catch (error) {
        console.error('Error parsing Naranja X statement:', error);
        return null;
    }
}

// Helper: Parsear número en formato argentino (1.000.000,00 -> 1000000.00)
function parseArgNumber(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Helper: Formatear fecha DD/MM a YYYY-MM-DD
function formatDateFromDDMM(dateStr: string): string {
    const [day, month] = dateStr.split('/');
    const year = new Date().getFullYear();
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper: Formatear fecha DD/MM/YY a YYYY-MM-DD
function formatDateFromDDMMYY(dateStr: string): string {
    const [day, month, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Helper: Obtener fecha del próximo mes
function getNextMonthDate(baseDate: string, monthsAhead: number): string {
    const [day, month, year] = baseDate.split('/');
    const date = new Date(parseInt(`20${year}`), parseInt(month) - 1 + monthsAhead, parseInt(day));
    return date.toISOString().split('T')[0];
}

/**
 * Detecta el tipo de resumen basado en el texto
 */
export function detectStatementType(text: string): 'naranja' | 'visa' | 'mastercard' | 'unknown' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('naranja') || lowerText.includes('naranjax')) return 'naranja';
    if (lowerText.includes('visa')) return 'visa';
    if (lowerText.includes('mastercard')) return 'mastercard';
    return 'unknown';
}

/**
 * Parsea cualquier tipo de resumen detectando automáticamente el tipo
 */
export function parseCreditCardStatement(text: string): CreditCardStatement | null {
    const type = detectStatementType(text);

    switch (type) {
        case 'naranja':
            return parseNaranjaXStatement(text);
        // Agregar más parsers aquí cuando sea necesario
        default:
            console.warn('Tipo de resumen no reconocido, intentando parser genérico...');
            return parseNaranjaXStatement(text); // Fallback
    }
}
