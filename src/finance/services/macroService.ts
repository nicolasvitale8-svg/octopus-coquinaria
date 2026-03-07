export interface InflationDataPoint {
    date: string;       // Formato YYYY-MM
    percentage: number; // Variación porcentual (ej: 2.7)
}

const API_URL = "https://apis.datos.gob.ar/series/api/series/?ids=101.1_I2NG_2016_M_22:percent_change&limit=12&sort=desc&format=json";
const CACHE_KEY = "octopus_macro_inflation_cache";
const CACHE_TIME_KEY = "octopus_macro_inflation_timestamp";

export const macroService = {
    /**
     * Obtiene los últimos 12 meses de inflación mensual reportada por el INDEC
     * (Nivel General). Cacheado en Session/Local Storage por 24 horas.
     */
    getMonthlyInflation: async (): Promise<InflationDataPoint[]> => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

            if (cached && cachedTime) {
                const diffHours = (new Date().getTime() - new Date(cachedTime).getTime()) / (1000 * 60 * 60);
                if (diffHours < 24) {
                    return JSON.parse(cached);
                }
            }

            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Error fetching inflation data");

            const raw = await response.json();

            if (!raw || !raw.data || !Array.isArray(raw.data)) {
                return [];
            }

            // raw.data viene como: [ ["2025-12-01", 0.027...], ["2025-11-01", 0.024...], ... ]
            // Lo transformamos multiplicando por 100 para porcentaje amigable.
            const formatted: InflationDataPoint[] = raw.data.map((row: any[]) => {
                const [fullDateStr, rawVal] = row;
                const [y, m] = fullDateStr.split('-');

                // Month name abbreviation
                const dateObj = new Date(Number(y), Number(m) - 1, 1);
                const monthName = dateObj.toLocaleDateString('es-ES', { month: 'short' });

                return {
                    date: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y.slice(2)}`,
                    percentage: Number((rawVal * 100).toFixed(1))
                };
            });

            // Guardar en caché y ordenarlo cronológicamente para el gráfico de barras (viene DESC, queremos ASC para Recharts)
            const graphData = formatted.reverse();
            localStorage.setItem(CACHE_KEY, JSON.stringify(graphData));
            localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());

            return graphData;

        } catch (error) {
            console.warn("No se pudo obtener la inflación macroeconómica", error);

            // Si falla pero hay caché viejo, devolverlo para que la app no quede vacía
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached);

            return [];
        }
    }
};
