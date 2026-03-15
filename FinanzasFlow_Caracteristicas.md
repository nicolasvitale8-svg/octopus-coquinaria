# Características de Finanzas Flow

Finanzas Flow es un módulo integral de gestión financiera diseñado para controlar ingresos, egresos, inversiones y presupuestos de forma anticipada y predictiva. Las principales características que conforman el sistema son:

## 📊 Dashboard y Visión General
- **Panel de control principal (Dashboard):** Resumen consolidado del estado actual, flujo mensual, y monitoreo general.
- **Resumen Anual y Mensual (Annual / Month Summary):** Visualización del rendimiento histórico, flujo neto mensual, y estadísticas sobre el "mejor" y "peor" mes del año.

## 🏦 Gestión de Cuentas (Accounts)
- **Soporte multi-cuenta:** Administración de efectivo, cuentas bancarias, billeteras virtuales (rendimientos) y tarjetas de crédito.
- **Tasas de Interés (TNA):** Configuración de tasas anuales para el rendimiento de fondos.
- **Límites de crédito:** Definición de topes para consumos con tarjeta.
- **Flujo de caja selectivo:** Posibilidad de elegir qué cuentas impactan en el cálculo del Cashflow del usuario.

## 💸 Transacciones y Clasificación
- **Movimientos:** Registro detallado de Ingresos, Egresos y transferencias a Ahorros.
- **Sistema de Categorías:** Categorización modular de movimientos en *Categoría Principal* y *Subcategoría* (clasificadas como ingreso, salida o mixto).

## 🎯 Presupuesto Inteligente (Budget)
- **Planificación por período:** Asignación de dinero planificado para determinados ítems (ingresos, gastos o metas de ahorro).
- **Gastos Recurrentes:** Identificación de gastos fijos y su ejecución mes a mes.
- **Gestión de Cuotas:** Seguimiento visual para compromisos divididos en varios pagos (mes actual de pago / total de cuotas).

## 🔮 Flujo de Caja (CashFlow)
- **Proyecciones futuras:** Seguimiento detallado a futuro sobre los ingresos esperados y los egresos de obligaciones presupuestadas.
- **Indicadores de balance:** Evolución de la posición de caja real versus esperada.

## 📈 Metas de Ahorro e Inversión (Jars)
- **Frascos (Jars):** Herramienta para dividir capital en objetivos específicos con plazos de inmovilización (fecha inicio / fin).
- **Cálculo de rendimientos:** Matemáticas financieras aplicadas para estimar en tiempo real los intereses devengados, valor final esperado de la inversión y los días restantes para la maduración.
- **Reinversión:** Posibilidad de configurar frascos con "Auto Reinvest" (Rollover).

## 💳 Préstamos y Cheques
- **Préstamos (Loans):** Registro de financiación externa que deba pagarse en cuotas. Incluye modelado de pago anticipado (*Early Payoff*) o amortizaciones adelantadas.
- **Módulo de Cheques:** Trazabilidad contable sobre cheques en cartera o de terceros.

## 🤖 Importación Automatizada (Import & Rules)
- **Carga de Batches (Lotes):** Importación masiva de gastos a partir de extractos (líneas de texto CSV/tabuladas).
- **Reglas Automáticas:** Configuración de reglas semánticas (*empieza con, es igual, contiene*) para auto-categorizar gastos basándose en los datos crudos del banco.
- **Detección inteligente:** Marcado preventivo de movimientos posiblemente duplicados en la importación.

## 🩺 Auditoría de Salud Financiera (Audit Report)
- **Score de Salud (Health Status):** Semáforo visual del comportamiento financiero general del mes (*Excelente, Bueno, Advertencia, Crítico*).
- **Análisis de Desvíos:** Desglose del "Por qué" hubieron diferencias frente a lo presupuestado (ej. gasto de única vez, inflación, cambio de volumen, no planificado).
- **Previsibilidad (Forecast Score):** Puntaje interno sobre la precisión con la que se logró predecir la realidad del mes.
- **Alertas y Riesgos:** Detección automática de alta concentración de gastos, tendencias al alza prolongadas o capital paralizado excesivo.
- **Recomendaciones Accionables:** Resumen automático de estrategias preventivas o correctivas sugeridas para el usuario, calificadas por impacto y dificultad de implementación.
- **Métricas Startup:** Control de "Burn Rate" (vel. de gasto) y cálculo de "Runway" (meses de supervivencia bajo esquema actual).
