/**
 * Logger Service
 * 
 * Centraliza todos los logs de la aplicación.
 * En DESARROLLO: muestra todos los logs
 * En PRODUCCIÓN: solo muestra errores y warnings
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    context?: string;
    data?: unknown;
}

const formatMessage = (level: LogLevel, message: string, context?: string): string => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${prefix} ${message}`;
};

export const logger = {
    /**
     * Debug logs - Solo visibles en desarrollo
     * Usar para información de debugging detallada
     */
    debug: (message: string, options?: LoggerOptions) => {
        if (isDev) {
            console.debug(
                `🔍 ${formatMessage('debug', message, options?.context)}`,
                options?.data ?? ''
            );
        }
    },

    /**
     * Info logs - Solo visibles en desarrollo
     * Usar para flujo normal de la aplicación
     */
    info: (message: string, options?: LoggerOptions) => {
        if (isDev) {
            console.log(
                `ℹ️ ${formatMessage('info', message, options?.context)}`,
                options?.data ?? ''
            );
        }
    },

    /**
     * Warning logs - Siempre visibles
     * Usar para situaciones inesperadas que no son errores
     */
    warn: (message: string, options?: LoggerOptions) => {
        console.warn(
            `⚠️ ${formatMessage('warn', message, options?.context)}`,
            options?.data ?? ''
        );
    },

    /**
     * Error logs - Siempre visibles
     * Usar para errores que necesitan atención
     */
    error: (message: string, options?: LoggerOptions) => {
        console.error(
            `❌ ${formatMessage('error', message, options?.context)}`,
            options?.data ?? ''
        );
    },

    /**
     * Success logs - Solo visibles en desarrollo
     * Usar para confirmar operaciones exitosas
     */
    success: (message: string, options?: LoggerOptions) => {
        if (isDev) {
            console.log(
                `✅ ${formatMessage('info', message, options?.context)}`,
                options?.data ?? ''
            );
        }
    },

    /**
     * Group logs - Para agrupar logs relacionados
     */
    group: (label: string, fn: () => void) => {
        if (isDev) {
            console.group(label);
            fn();
            console.groupEnd();
        }
    }
};

// Export default para imports más limpios
export default logger;
