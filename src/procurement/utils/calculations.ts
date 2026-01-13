
/**
 * Calcula la cantidad sugerida de compra para un insumo.
 * Fórmula:
 * Objetivo = MAX(StockMax, StockMin + (ConsumoDiario * LeadTime))
 * Bruto = Objetivo - StockActual - Pendiente
 * Sugerido = RedondeoArriba(Bruto / Pack) * Pack
 */
export const calcularSugerido = (
    stockMax: number,
    stockMin: number,
    stockActual: number,
    consumoDiario: number,
    leadTime: number,
    pendiente: number,
    pack: number
): number => {
    // Evitar división por cero
    const packSize = pack > 0 ? pack : 1;

    const objetivo = Math.max(stockMax, stockMin + (consumoDiario * leadTime));
    const bruto = objetivo - stockActual - pendiente;

    if (bruto <= 0) return 0;

    const bultos = Math.ceil(bruto / packSize);
    return bultos * packSize;
};

/**
 * Valida si el monto total excede el presupuesto disponible.
 */
export const validarPresupuesto = (
    montoTotal: number,
    montoGastado: number,
    limitePresupuesto: number
): { excedido: boolean; restante: number; nuevoRestante: number } => {
    const restante = limitePresupuesto - montoGastado;
    const nuevoRestante = restante - montoTotal;

    return {
        excedido: nuevoRestante < 0,
        restante,
        nuevoRestante
    };
};
