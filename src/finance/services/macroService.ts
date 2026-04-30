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

/**
 * Helper interno: hace fetch real al API datos.gob.ar y guarda en cache.
 * Solo se llama desde refreshMonthlyInflation() — NO automatico.
 */
const fetchFromAPI = async (): Promise<InflationDataPoint[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error fetching inflation data");
    const raw = await response.json();
    if (!raw?.data || !Array.isArray(raw.data)) return [];

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

    const graphData = formatted.reverse(); // ASC cronológico
    localStorage.setItem(CACHE_KEY, JSON.stringify(graphData));
    localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());
    return graphData;
};

export const macroService = {
    /**
     * Devuelve la inflación cacheada en localStorage.
     *
     * NO HACE FETCH AUTOMATICO. Si el cache esta vacio retorna array vacio
     * — la UI debe mostrar el boton "actualizar" para que el usuario decida
     * cuando hacer el fetch.
     *
     * Decision deliberada: pedido del usuario que la inflacion no cambie
     * sin su accion explicita (commit del 30/04/26).
     */
    getMonthlyInflation: async (): Promise<InflationDataPoint[]> => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try { return JSON.parse(cached); } catch { return []; }
        }
        return [];
    },

    /**
     * Fecha del ultimo fetch manual (ISO) o null si nunca se actualizo.
     */
    getLastUpdateTime: (): string | null => {
        return localStorage.getItem(CACHE_TIME_KEY);
    },

    /**
     * Refresca explicitamente la inflacion desde datos.gob.ar.
     * Llamar SOLO desde un click del usuario en el boton "actualizar".
     */
    refreshMonthlyInflation: async (): Promise<InflationDataPoint[]> => {
        try {
            return await fetchFromAPI();
        } catch (error) {
            console.warn("[macroService] Error al actualizar inflacion", error);
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try { return JSON.parse(cached); } catch { return []; }
            }
            return [];
        }
    },

    /**
     * Limpia el cache de inflacion. Tras llamar esto, getMonthlyInflation()
     * vuelve a retornar [] hasta que el usuario haga refresh manual.
     */
    clearInflationCache: (): void => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    },
};
