export interface InflationDataPoint {
    date: string;       // Ej: "Ene 25"
    real: number | null;      // Variación % real del IPC (ej: 2.7)
    estimated: number | null; // Variación % estimada del REM (ej: 2.3)
}

// Serie real del IPC Nacional (INDEC) — variación mensual
const IPC_REAL_ID = "101.1_I2NG_2016_M_22:percent_change";
// Serie estimada del REM (BCRA) — mediana IPC Nacional variación mensual
const REM_ESTIMATED_ID = "430.1_REM_IPC_NAL_T_M_0_0_25_28";

const API_URL = `https://apis.datos.gob.ar/series/api/series/?ids=${IPC_REAL_ID},${REM_ESTIMATED_ID}&limit=12&sort=desc&format=json`;

const CACHE_KEY = "octopus_macro_inflation_v2";
const CACHE_TIME_KEY = "octopus_macro_inflation_v2_ts";

export const macroService = {
    /**
     * Obtiene los últimos 12 meses de inflación mensual:
     * - Real: IPC INDEC (Nivel General)
     * - Estimada: REM BCRA (Mediana)
     * Cacheado en localStorage por 12 horas.
     */
    getMonthlyInflation: async (): Promise<InflationDataPoint[]> => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

            if (cached && cachedTime) {
                const diffHours = (Date.now() - new Date(cachedTime).getTime()) / (1000 * 60 * 60);
                if (diffHours < 12) {
                    return JSON.parse(cached);
                }
            }

            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Error fetching inflation data");

            const raw = await response.json();

            if (!raw?.data || !Array.isArray(raw.data)) return [];

            // raw.data viene como: [ ["2025-12-01", 0.027, 0.023], ... ]
            // Columna 1 = IPC real, Columna 2 = REM estimada
            const formatted: InflationDataPoint[] = raw.data.map((row: any[]) => {
                const [fullDateStr, rawReal, rawEstimated] = row;
                const [y, m] = fullDateStr.split('-');

                const dateObj = new Date(Number(y), Number(m) - 1, 1);
                const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });

                return {
                    date: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y.slice(2)}`,
                    real: rawReal != null ? Number((rawReal * 100).toFixed(1)) : null,
                    estimated: rawEstimated != null ? Number((rawEstimated * 100).toFixed(1)) : null,
                };
            });

            // Viene DESC, lo invertimos para ASC (cronológico para el gráfico)
            const graphData = formatted.reverse();
            localStorage.setItem(CACHE_KEY, JSON.stringify(graphData));
            localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());

            return graphData;
        } catch (error) {
            console.warn("[macroService] Error al obtener inflación", error);
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached);
            return [];
        }
    }
};
