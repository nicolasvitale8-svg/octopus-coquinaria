import {
  Jar, JarCalculation, Transaction, TransactionType, Account, MonthlyBalance, BudgetItem,
  AuditReport, DeviationItem, CategoryHealth, ExceedDriver, RiskAlert, RecommendedAction,
  VarianceReason, HealthStatus, ForecastRank, Category, MonthSummary, YearSummary,
  CategoryBreakdown, MonthReport
} from '../financeTypes';

export const calculateJar = (jar: Jar): JarCalculation => {
  const start = new Date(jar.startDate);
  const end = new Date(jar.endDate);
  const today = new Date();

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const oneDay = 24 * 60 * 60 * 1000;

  const daysTotal = Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay));
  let daysElapsed = Math.round((today.getTime() - start.getTime()) / oneDay);

  if (daysElapsed < 0) daysElapsed = 0;
  if (daysElapsed > daysTotal) daysElapsed = daysTotal;

  const daysRemaining = daysTotal - daysElapsed;

  const dailyRate = (jar.annualRate / 100) / 365;

  const currentValue = jar.principal * Math.pow(1 + dailyRate, daysElapsed);
  const finalValue = jar.principal * Math.pow(1 + dailyRate, daysTotal);
  const interestAccrued = currentValue - jar.principal;

  return {
    jar,
    daysTotal,
    daysElapsed,
    daysRemaining,
    currentValue,
    finalValue,
    interestAccrued
  };
};

/**
 * Calculates the nearest working day for a given day/month/year.
 * If fallbackToFriday is true, it moves back to the preceding Friday; otherwise, it moves to Monday.
 */
export const getAdjustedWorkingDay = (day: number, month: number, year: number, fallbackToFriday = false): Date => {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0: Sunday, 6: Saturday

  if (dayOfWeek === 0) { // Sunday
    date.setDate(date.getDate() + (fallbackToFriday ? -2 : 1));
  } else if (dayOfWeek === 6) { // Saturday
    date.setDate(date.getDate() + (fallbackToFriday ? -1 : 2));
  }

  return date;
};

/**
 * Calculates account balances for a specific period (Month/Year).
 * If no monthly balance exists for the start of the period, it returns 0 as start.
 */
export const calculatePeriodBalance = (
  account: Account,
  transactions: Transaction[],
  monthlyBalances: MonthlyBalance[],
  month: number,
  year: number
) => {
  // 1. Find Opening Balance for this month
  const openingRecord = monthlyBalances.find(mb => mb.accountId === account.id && mb.year === year && mb.month === month);
  const openingBalance = openingRecord ? openingRecord.amount : 0;

  // 2. Filter Transactions for this specific month/year and account
  const periodTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return t.accountId === account.id && d.getMonth() === month && d.getFullYear() === year;
  });

  const totalIn = periodTransactions.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = periodTransactions.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);

  return {
    account,
    openingBalance, // Initial for this month
    totalIn,
    totalOut,
    finalBalance: openingBalance + totalIn - totalOut,
    hasOpeningRecord: !!openingRecord
  };
};

/**
 * Proposes an opening balance for a new month based on the PREVIOUS month's final balance.
 */
export const getProposedOpeningBalance = (
  accountId: string,
  transactions: Transaction[],
  monthlyBalances: MonthlyBalance[],
  targetMonth: number,
  targetYear: number
): number => {
  // Determine previous period
  let prevMonth = targetMonth - 1;
  let prevYear = targetYear;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = targetYear - 1;
  }

  // Calculate the final balance of the previous period
  // We need to simulate the 'calculatePeriodBalance' logic for that previous month
  const prevOpeningRecord = monthlyBalances.find(mb => mb.accountId === accountId && mb.year === prevYear && mb.month === prevMonth);
  const prevOpening = prevOpeningRecord ? prevOpeningRecord.amount : 0;

  const prevTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return t.accountId === accountId && d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const totalIn = prevTransactions.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
  const totalOut = prevTransactions.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);

  return prevOpening + totalIn - totalOut;
};

// Legacy global calculation (still useful for 'current state' if we assume strict continuity)
export const calculateAccountBalances = (accounts: Account[], transactions: Transaction[]) => {
  return accounts.map(acc => {
    const accTrans = transactions.filter(t => t.accountId === acc.id);
    const totalIn = accTrans.filter(t => t.type === TransactionType.IN).reduce((sum, t) => sum + t.amount, 0);
    const totalOut = accTrans.filter(t => t.type === TransactionType.OUT).reduce((sum, t) => sum + t.amount, 0);
    // Note: This legacy calculation assumes 0 start, which is superseded by Monthly Balances logic in the dashboard
    return {
      ...acc,
      currentBalance: totalIn - totalOut // Simplified
    };
  });
};

export const formatCurrency = (amount: number, currency: string = 'ARS') => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatPercentage = (val: number) => {
  return `${(val * 100).toFixed(1)}%`;
};

export const calculateBudgetAlerts = (
  budgetItems: BudgetItem[],
  transactions: Transaction[],
  month: number,
  year: number
) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const currentDay = today.getDate();

  const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth);
  const isCurrentMonth = year === currentYear && month === currentMonth;

  if (!isPastMonth && !isCurrentMonth) return [];

  return budgetItems.filter(item => {
    if (item.month !== month || item.year !== year) return false;

    const targetDay = item.plannedDate || 1;

    // Only show if it's already due or due within 3 days
    if (isCurrentMonth && targetDay > currentDay + 3) return false;

    // Check for matching transactions
    const hasMatch = transactions.some(t => {
      const transDate = new Date(t.date);
      // We look for transactions in the same month/year
      // NOTE: We could be more strict with dates if needed
      return transDate.getMonth() === month &&
        transDate.getFullYear() === year &&
        t.categoryId === item.categoryId &&
        (!item.subCategoryId || t.subCategoryId === item.subCategoryId) &&
        Math.abs(t.amount - item.plannedAmount) / item.plannedAmount < 0.2;
    });

    return !hasMatch;
  });
};

// --- ANNUAL VIEW & REPORTS ---

// Helper para parsear fechas string "YYYY-MM-DD" en local sin timezone shift
const parseDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Calcula el resumen anual con datos de cada mes
 */
export const calculateYearSummary = (
  transactions: Transaction[],
  categories: Category[],
  year: number
): YearSummary => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const months: MonthSummary[] = [];

  for (let month = 0; month < 12; month++) {
    const monthTransactions = transactions.filter(t => {
      const d = parseDate(t.date);
      const isTransfer = t.description?.toLowerCase().includes('transferencia');
      return d.getMonth() === month && d.getFullYear() === year && !isTransfer;
    });

    const totalIn = monthTransactions
      .filter(t => t.type === TransactionType.IN)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOut = monthTransactions
      .filter(t => t.type === TransactionType.OUT)
      .reduce((sum, t) => sum + t.amount, 0);

    // Top categories for expenses
    const categoryMap: Record<string, number> = {};
    monthTransactions
      .filter(t => t.type === TransactionType.OUT)
      .forEach(t => {
        categoryMap[t.categoryId] = (categoryMap[t.categoryId] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryMap)
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: categories.find(c => c.id === categoryId)?.name || 'Sin Categoría',
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const isClosed = year < currentYear || (year === currentYear && month < currentMonth);

    months.push({
      month,
      year,
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
      transactionCount: monthTransactions.length,
      topCategories,
      isClosed
    });
  }

  const totalIn = months.reduce((sum, m) => sum + m.totalIn, 0);
  const totalOut = months.reduce((sum, m) => sum + m.totalOut, 0);
  const monthsWithData = months.filter(m => m.transactionCount > 0);

  const bestMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((best, m) => m.netBalance > best.netBalance ? m : best)
    : null;

  const worstMonth = monthsWithData.length > 0
    ? monthsWithData.reduce((worst, m) => m.netBalance < worst.netBalance ? m : worst)
    : null;

  return {
    year,
    months,
    totalIn,
    totalOut,
    netBalance: totalIn - totalOut,
    averageMonthlyIn: monthsWithData.length > 0 ? totalIn / monthsWithData.length : 0,
    averageMonthlyOut: monthsWithData.length > 0 ? totalOut / monthsWithData.length : 0,
    bestMonth,
    worstMonth
  };
};

/**
 * Genera un informe detallado de un mes específico
 */
export const generateMonthReport = (
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  monthlyBalances: MonthlyBalance[],
  month: number,
  year: number,
  entityName: string
): MonthReport => {
  const monthTransactions = transactions.filter(t => {
    const d = parseDate(t.date);
    const isTransfer = t.description?.toLowerCase().includes('transferencia');
    return d.getMonth() === month && d.getFullYear() === year && !isTransfer;
  });

  const totalIn = monthTransactions
    .filter(t => t.type === TransactionType.IN)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOut = monthTransactions
    .filter(t => t.type === TransactionType.OUT)
    .reduce((sum, t) => sum + t.amount, 0);

  // Calcular opening balance sumando todos los balances de apertura de las cuentas activas
  const openingBalance = accounts
    .filter(a => a.isActive)
    .reduce((sum, acc) => {
      const mb = monthlyBalances.find(b => b.accountId === acc.id && b.year === year && b.month === month);
      return sum + (mb?.amount || 0);
    }, 0);

  const closingBalance = openingBalance + totalIn - totalOut;

  // Income breakdown by category
  const incomeMap: Record<string, { amount: number; count: number }> = {};
  monthTransactions
    .filter(t => t.type === TransactionType.IN)
    .forEach(t => {
      if (!incomeMap[t.categoryId]) incomeMap[t.categoryId] = { amount: 0, count: 0 };
      incomeMap[t.categoryId].amount += t.amount;
      incomeMap[t.categoryId].count += 1;
    });

  const incomeBreakdown: CategoryBreakdown[] = Object.entries(incomeMap)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: categories.find(c => c.id === categoryId)?.name || 'Sin Categoría',
      amount: data.amount,
      percentage: totalIn > 0 ? (data.amount / totalIn) * 100 : 0,
      transactionCount: data.count
    }))
    .sort((a, b) => b.amount - a.amount);

  // Expense breakdown by category
  const expenseMap: Record<string, { amount: number; count: number }> = {};
  monthTransactions
    .filter(t => t.type === TransactionType.OUT)
    .forEach(t => {
      if (!expenseMap[t.categoryId]) expenseMap[t.categoryId] = { amount: 0, count: 0 };
      expenseMap[t.categoryId].amount += t.amount;
      expenseMap[t.categoryId].count += 1;
    });

  const expenseBreakdown: CategoryBreakdown[] = Object.entries(expenseMap)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: categories.find(c => c.id === categoryId)?.name || 'Sin Categoría',
      amount: data.amount,
      percentage: totalOut > 0 ? (data.amount / totalOut) * 100 : 0,
      transactionCount: data.count
    }))
    .sort((a, b) => b.amount - a.amount);

  // Comparativa con el mes anterior
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear = year - 1;
  }

  const prevTransactions = transactions.filter(t => {
    const d = parseDate(t.date);
    const isTransfer = t.description?.toLowerCase().includes('transferencia');
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear && !isTransfer;
  });

  const prevTotalIn = prevTransactions
    .filter(t => t.type === TransactionType.IN)
    .reduce((sum, t) => sum + t.amount, 0);

  const prevTotalOut = prevTransactions
    .filter(t => t.type === TransactionType.OUT)
    .reduce((sum, t) => sum + t.amount, 0);

  const hasPrevData = prevTransactions.length > 0;

  return {
    month,
    year,
    entityName,
    generatedAt: new Date().toISOString(),
    totalIn,
    totalOut,
    netBalance: totalIn - totalOut,
    openingBalance,
    closingBalance,
    incomeBreakdown,
    expenseBreakdown,
    comparison: {
      prevMonth: hasPrevData ? {
        totalIn: prevTotalIn,
        totalOut: prevTotalOut,
        netBalance: prevTotalIn - prevTotalOut
      } : null,
      incomeDelta: hasPrevData && prevTotalIn > 0 ? ((totalIn - prevTotalIn) / prevTotalIn) * 100 : 0,
      expenseDelta: hasPrevData && prevTotalOut > 0 ? ((totalOut - prevTotalOut) / prevTotalOut) * 100 : 0,
      balanceDelta: hasPrevData ? (totalIn - totalOut) - (prevTotalIn - prevTotalOut) : 0
    }
  };
};

// ============ AUDIT REPORT GENERATION ============

/**
 * Detecta la razón de la varianza basándose en patrones de transacciones
 */
const detectVarianceReason = (
  transactions: Transaction[],
  planned: number,
  actual: number,
  prevMonthActual: number | null
): { reason: VarianceReason; detail: string; confidence: number } => {
  if (transactions.length === 0 && planned > 0) {
    return { reason: 'unknown', detail: 'Sin transacciones registradas', confidence: 50 };
  }

  const txCount = transactions.length;
  const amounts = transactions.map(t => t.amount);
  const maxTx = Math.max(...amounts, 0);
  const avgTx = actual / Math.max(txCount, 1);
  const deviation = actual - planned;
  const deviationPct = planned > 0 ? (deviation / planned) * 100 : 0;

  // Sin presupuesto
  if (planned === 0 && actual > 0) {
    return { reason: 'unbudgeted', detail: 'Categoría sin presupuesto asignado', confidence: 95 };
  }

  // Si está dentro de margen, no hay varianza significativa
  if (Math.abs(deviationPct) < 10) {
    return { reason: 'unknown', detail: 'Dentro del rango esperado', confidence: 90 };
  }

  // 1-2 tx concentradas = evento puntual
  if (txCount <= 2 && txCount > 0) {
    return { reason: 'one_off', detail: `${txCount} transacción${txCount > 1 ? 'es' : ''} puntual${txCount > 1 ? 'es' : ''}`, confidence: 90 };
  }

  // Pocas tx con una muy grande = evento puntual
  if (txCount <= 5 && maxTx > actual * 0.5) {
    return { reason: 'one_off', detail: `Transacción dominante: ${formatCurrency(maxTx)} (${((maxTx / actual) * 100).toFixed(0)}% del total)`, confidence: 85 };
  }

  // Tendencia vs mes anterior (+20% o más)
  if (prevMonthActual !== null && prevMonthActual > 0) {
    const change = ((actual - prevMonthActual) / prevMonthActual) * 100;
    if (change > 25) {
      return { reason: 'trend', detail: `+${change.toFixed(0)}% vs mes anterior`, confidence: 80 };
    }
    if (change < -25) {
      return { reason: 'trend', detail: `${change.toFixed(0)}% vs mes anterior`, confidence: 80 };
    }
  }

  // Muchas tx pequeñas = derrame/leak
  if (txCount > 4 && maxTx < avgTx * 2) {
    return { reason: 'leak', detail: `${txCount} transacciones distribuidas`, confidence: 75 };
  }

  // Fallback con descripción útil
  if (deviation > 0) {
    return { reason: 'unknown', detail: `Exceso de ${formatCurrency(deviation)} en ${txCount} tx`, confidence: 50 };
  } else {
    return { reason: 'unknown', detail: `Ahorro de ${formatCurrency(Math.abs(deviation))}`, confidence: 50 };
  }
};

/**
 * Calcula el estado de salud de una categoría
 */
const calculateHealthStatus = (planned: number, actual: number, trendPct: number): HealthStatus => {
  if (planned === 0) return actual > 0 ? 'warning' : 'good';

  const executionRate = (actual / planned) * 100;

  if (executionRate <= 90) return 'excellent';
  if (executionRate <= 110) return 'good';
  if (executionRate <= 130) return 'warning';
  return 'critical';
};

/**
 * Genera el reporte de auditoría completo
 */
export const generateAuditReport = (
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  monthlyBalances: MonthlyBalance[],
  budgetItems: BudgetItem[],
  month: number,
  year: number,
  entityName: string
): AuditReport => {
  // Fechas de referencia
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  // Filtrar transacciones del mes actual (sin transferencias)
  const monthTx = transactions.filter(t => {
    const d = parseDate(t.date);
    const isTransfer = t.description?.toLowerCase().includes('transferencia');
    return d.getMonth() === month && d.getFullYear() === year && !isTransfer;
  });

  // Transacciones de los últimos 3 meses para comparativo
  const get3MonthsTx = () => {
    const result: Transaction[][] = [];
    for (let i = 1; i <= 3; i++) {
      const m = (month - i + 12) % 12;
      const y = month - i < 0 ? year - 1 : year;
      result.push(transactions.filter(t => {
        const d = parseDate(t.date);
        return d.getMonth() === m && d.getFullYear() === y;
      }));
    }
    return result;
  };
  const prev3MonthsTx = get3MonthsTx();

  // Totales del mes
  const totalIn = monthTx.filter(t => t.type === TransactionType.IN).reduce((s, t) => s + t.amount, 0);
  const totalOut = monthTx.filter(t => t.type === TransactionType.OUT).reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIn - totalOut;

  // Presupuesto del mes (solo gastos)
  const monthBudgets = budgetItems.filter(b => b.month === month && b.year === year && b.type === TransactionType.OUT);
  const totalPlanned = monthBudgets.reduce((s, b) => s + b.plannedAmount, 0);

  // Mes anterior
  const prevMonthTx = transactions.filter(t => {
    const d = parseDate(t.date);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });
  const prevTotalIn = prevMonthTx.filter(t => t.type === TransactionType.IN).reduce((s, t) => s + t.amount, 0);
  const prevTotalOut = prevMonthTx.filter(t => t.type === TransactionType.OUT).reduce((s, t) => s + t.amount, 0);

  // Promedio 3 meses
  const avg3M = {
    totalIn: prev3MonthsTx.reduce((s, txs) => s + txs.filter(t => t.type === TransactionType.IN).reduce((a, t) => a + t.amount, 0), 0) / 3,
    totalOut: prev3MonthsTx.reduce((s, txs) => s + txs.filter(t => t.type === TransactionType.OUT).reduce((a, t) => a + t.amount, 0), 0) / 3,
    netBalance: 0
  };
  avg3M.netBalance = avg3M.totalIn - avg3M.totalOut;

  // ============ 1. TOP 5 DESVÍOS ============
  // Agrupar presupuestos por categoría para evitar duplicados
  const budgetByCategory: Record<string, { planned: number; labels: string[] }> = {};
  for (const budget of monthBudgets) {
    if (!budgetByCategory[budget.categoryId]) {
      budgetByCategory[budget.categoryId] = { planned: 0, labels: [] };
    }
    budgetByCategory[budget.categoryId].planned += budget.plannedAmount;
    if (budget.label && !budgetByCategory[budget.categoryId].labels.includes(budget.label)) {
      budgetByCategory[budget.categoryId].labels.push(budget.label);
    }
  }

  const budgetExecutions: DeviationItem[] = [];

  // Calcular ejecución por categoría (no por item individual)
  for (const [categoryId, budgetData] of Object.entries(budgetByCategory)) {
    const categoryTx = monthTx.filter(t => t.categoryId === categoryId && t.type === TransactionType.OUT);
    const actual = categoryTx.reduce((s, t) => s + t.amount, 0);
    const planned = budgetData.planned;
    const deviation = actual - planned;
    const deviationPercent = planned > 0 ? (deviation / planned) * 100 : 0;

    // Obtener mes anterior para esta categoría
    const prevCatTx = prevMonthTx.filter(t => t.categoryId === categoryId && t.type === TransactionType.OUT);
    const prevActual = prevCatTx.reduce((s, t) => s + t.amount, 0);

    const { reason, detail, confidence } = detectVarianceReason(categoryTx, planned, actual, prevActual);
    const categoryName = categories.find(c => c.id === categoryId)?.name || 'Sin Categoría';

    budgetExecutions.push({
      label: budgetData.labels.length > 0 ? budgetData.labels.join(', ') : categoryName,
      categoryId,
      categoryName,
      planned,
      actual,
      deviation,
      deviationPercent,
      reason,
      reasonDetail: detail,
      confidence,
      transactionCount: categoryTx.length
    });
  }

  const topExceeded = budgetExecutions
    .filter(b => b.deviation > 0)
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 5);

  const topSaved = budgetExecutions
    .filter(b => b.deviation < 0)
    .sort((a, b) => a.deviation - b.deviation)
    .slice(0, 5);

  // ============ 2. GASTOS NO PRESUPUESTADOS ============
  const budgetedCategoryIds = new Set(monthBudgets.map(b => b.categoryId));
  const unbudgetedTx = monthTx.filter(t =>
    t.type === TransactionType.OUT && !budgetedCategoryIds.has(t.categoryId)
  );
  const totalUnbudgeted = unbudgetedTx.reduce((s, t) => s + t.amount, 0);

  // Agrupar por categoría
  const unbudgetedByCategory: Record<string, number> = {};
  unbudgetedTx.forEach(t => {
    unbudgetedByCategory[t.categoryId] = (unbudgetedByCategory[t.categoryId] || 0) + t.amount;
  });

  // ============ 3. SEMÁFORO POR CATEGORÍA ============
  const categoryHealth: CategoryHealth[] = [];
  const categoryIds = [...new Set(monthTx.filter(t => t.type === TransactionType.OUT).map(t => t.categoryId))];

  for (const catId of categoryIds) {
    const catTx = monthTx.filter(t => t.categoryId === catId && t.type === TransactionType.OUT);
    const actual = catTx.reduce((s, t) => s + t.amount, 0);
    const planned = monthBudgets.filter(b => b.categoryId === catId).reduce((s, b) => s + b.plannedAmount, 0);

    // Promedio 3M para esta categoría
    const cat3MTotal = prev3MonthsTx.reduce((s, txs) =>
      s + txs.filter(t => t.categoryId === catId && t.type === TransactionType.OUT).reduce((a, t) => a + t.amount, 0), 0);
    const cat3MAvg = cat3MTotal / 3;

    // Mes anterior
    const catPrevTotal = prevMonthTx.filter(t => t.categoryId === catId && t.type === TransactionType.OUT)
      .reduce((s, t) => s + t.amount, 0);

    const trend3M = cat3MAvg > 0 ? ((actual - cat3MAvg) / cat3MAvg) * 100 : 0;
    const trendPrevMonth = catPrevTotal > 0 ? ((actual - catPrevTotal) / catPrevTotal) * 100 : 0;

    categoryHealth.push({
      categoryId: catId,
      categoryName: categories.find(c => c.id === catId)?.name || 'Sin Categoría',
      planned,
      actual,
      status: calculateHealthStatus(planned, actual, trend3M),
      weight: totalOut > 0 ? (actual / totalOut) * 100 : 0,
      trend3M,
      trendPrevMonth
    });
  }

  categoryHealth.sort((a, b) => b.actual - a.actual);

  // ============ 4. DRIVERS DEL EXCEDENTE ============
  const exceedDrivers: Record<string, ExceedDriver[]> = {};

  for (const exceeded of topExceeded) {
    const catTx = monthTx.filter(t => t.categoryId === exceeded.categoryId && t.type === TransactionType.OUT);
    const drivers: ExceedDriver[] = [];

    // Por cuenta
    const byAccount: Record<string, number> = {};
    catTx.forEach(t => {
      byAccount[t.accountId] = (byAccount[t.accountId] || 0) + t.amount;
    });

    Object.entries(byAccount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([accId, amount]) => {
        const acc = accounts.find(a => a.id === accId);
        drivers.push({
          type: 'account',
          label: acc?.name || 'Cuenta desconocida',
          amount,
          percentage: (amount / exceeded.actual) * 100
        });
      });

    // Por vendor (extraer de description)
    const byVendor: Record<string, number> = {};
    catTx.forEach(t => {
      const vendor = t.description.split(/[\s\-\/]/)[0]?.toUpperCase() || 'OTROS';
      byVendor[vendor] = (byVendor[vendor] || 0) + t.amount;
    });

    Object.entries(byVendor)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .forEach(([vendor, amount]) => {
        drivers.push({
          type: 'vendor',
          label: vendor,
          amount,
          percentage: (amount / exceeded.actual) * 100
        });
      });

    // Por timing (semana del mes)
    const byWeek: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    catTx.forEach(t => {
      const day = parseDate(t.date).getDate();
      const week = Math.ceil(day / 7);
      byWeek[week] = (byWeek[week] || 0) + t.amount;
    });

    const maxWeek = Object.entries(byWeek).sort((a, b) => b[1] - a[1])[0];
    if (maxWeek && maxWeek[1] > exceeded.actual * 0.4) {
      drivers.push({
        type: 'timing',
        label: `Semana ${maxWeek[0]}`,
        amount: maxWeek[1],
        percentage: (maxWeek[1] / exceeded.actual) * 100
      });
    }

    exceedDrivers[exceeded.categoryId] = drivers;
  }

  // ============ 5. SCORE DE PREVISIBILIDAD ============
  const tolerance = 0.1; // ±10%
  const withinTolerance = budgetExecutions.filter(b =>
    b.planned > 0 && Math.abs(b.deviationPercent) <= tolerance * 100
  ).length;
  const totalBudgetItems = budgetExecutions.filter(b => b.planned > 0).length;
  const withinTolerancePct = totalBudgetItems > 0 ? (withinTolerance / totalBudgetItems) * 100 : 0;

  const absoluteDeviation = budgetExecutions.reduce((s, b) => s + Math.abs(b.deviation), 0);
  const totalDeviationPct = totalPlanned > 0 ? (absoluteDeviation / totalPlanned) * 100 : 0;

  let forecastRank: ForecastRank = 'fantasy';
  if (withinTolerancePct >= 70 && totalDeviationPct <= 15) forecastRank = 'solid';
  else if (withinTolerancePct >= 50 && totalDeviationPct <= 30) forecastRank = 'acceptable';

  // ============ 6. ALERTAS DE RIESGO ============
  const riskAlerts: RiskAlert[] = [];

  // Items sin ejecutar que podrían ser críticos
  const unusedBudgets = monthBudgets.filter(b => {
    const executed = monthTx.filter(t => t.categoryId === b.categoryId && t.type === TransactionType.OUT)
      .reduce((s, t) => s + t.amount, 0);
    return executed === 0 && b.plannedAmount > 0;
  });

  unusedBudgets.forEach(b => {
    riskAlerts.push({
      type: 'unused_critical',
      severity: b.plannedAmount > totalPlanned * 0.1 ? 'high' : 'medium',
      message: `"${b.label}" presupuestado pero sin ejecutar`,
      category: categories.find(c => c.id === b.categoryId)?.name,
      amount: b.plannedAmount
    });
  });

  // Concentración
  const topCategory = categoryHealth[0];
  if (topCategory && topCategory.weight > 30) {
    riskAlerts.push({
      type: 'concentration',
      severity: topCategory.weight > 50 ? 'high' : 'medium',
      message: `${topCategory.weight.toFixed(0)}% del gasto concentrado en "${topCategory.categoryName}"`,
      category: topCategory.categoryName,
      amount: topCategory.actual
    });
  }

  // Gastos no presupuestados significativos
  if (totalUnbudgeted > totalPlanned * 0.1) {
    riskAlerts.push({
      type: 'unbudgeted',
      severity: totalUnbudgeted > totalPlanned * 0.2 ? 'high' : 'medium',
      message: `${formatCurrency(totalUnbudgeted)} en gastos sin presupuesto (${((totalUnbudgeted / totalOut) * 100).toFixed(0)}% del total)`,
      amount: totalUnbudgeted
    });
  }

  // Tendencia peligrosa vs 3M
  categoryHealth.filter(c => c.trend3M > 30 && c.weight > 10).forEach(c => {
    riskAlerts.push({
      type: 'trend',
      severity: c.trend3M > 50 ? 'high' : 'medium',
      message: `"${c.categoryName}" subió ${c.trend3M.toFixed(0)}% vs promedio 3M`,
      category: c.categoryName
    });
  });

  // ============ 7. ACCIONES RECOMENDADAS ============
  const recommendedActions: RecommendedAction[] = [];
  const nextMonthDate = new Date(year, month + 1, 15);
  const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Por cada excedente significativo
  topExceeded.slice(0, 3).forEach(ex => {
    if (ex.deviation > totalPlanned * 0.05) {
      let action = '';
      let difficulty: 'low' | 'medium' | 'high' = 'medium';

      if (ex.reason === 'leak') {
        action = `${ex.categoryName}: crear tope semanal y aprobación previa > ${formatCurrency(ex.actual / 4)}`;
        difficulty = 'low';
      } else if (ex.reason === 'one_off') {
        action = `${ex.categoryName}: revisar si es recurrente, ajustar presupuesto si aplica`;
        difficulty = 'low';
      } else if (ex.reason === 'trend') {
        action = `${ex.categoryName}: negociar precios o buscar alternativas`;
        difficulty = 'high';
      } else {
        action = `${ex.categoryName}: investigar causa y definir límite`;
        difficulty = 'medium';
      }

      recommendedActions.push({
        action,
        impact: ex.deviation > totalPlanned * 0.1 ? 'high' : 'medium',
        difficulty,
        owner: 'Finanzas',
        dueDate: formatDate(nextMonthDate),
        category: ex.categoryName
      });
    }
  });

  // Por concentración
  if (topCategory && topCategory.weight > 40) {
    recommendedActions.push({
      action: `Diversificar: ${topCategory.categoryName} representa ${topCategory.weight.toFixed(0)}% del gasto`,
      impact: 'medium',
      difficulty: 'high',
      owner: 'Operaciones',
      dueDate: formatDate(new Date(year, month + 2, 1)),
      category: topCategory.categoryName
    });
  }

  // Por no presupuestados
  if (totalUnbudgeted > totalPlanned * 0.15) {
    recommendedActions.push({
      action: `Crear presupuestos para categorías con ${formatCurrency(totalUnbudgeted)} sin asignar`,
      impact: 'high',
      difficulty: 'low',
      owner: 'Finanzas',
      dueDate: formatDate(nextMonthDate)
    });
  }

  // ============ 8. FORECAST ============
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const currentDay = today.getMonth() === month && today.getFullYear() === year ? today.getDate() : daysInMonth;
  const projectedClose = (totalOut / currentDay) * daysInMonth;

  // Ajustes recomendados para próximo mes
  const adjustmentsByCategory = topExceeded
    .filter(e => e.reason === 'trend' || e.reason === 'leak')
    .map(e => ({
      categoryId: e.categoryId,
      categoryName: e.categoryName,
      suggested: e.actual * 1.1 // +10% sobre lo real
    }));

  // ============ 9. FOTO DE CAJA ============
  const openingBalance = monthlyBalances
    .filter(mb => mb.month === month && mb.year === year)
    .reduce((s, mb) => s + mb.amount, 0);

  const closingBalance = openingBalance + totalIn - totalOut;
  const burnRate = totalOut;

  // ============ HEALTH SCORE GLOBAL ============
  const executionRate = totalPlanned > 0 ? (totalOut / totalPlanned) * 100 : 0;
  let healthScore: HealthStatus = 'good';

  const criticalCategories = categoryHealth.filter(c => c.status === 'critical').length;
  const warningCategories = categoryHealth.filter(c => c.status === 'warning').length;

  if (executionRate <= 95 && criticalCategories === 0 && riskAlerts.filter(a => a.severity === 'high').length === 0) {
    healthScore = 'excellent';
  } else if (executionRate <= 110 && criticalCategories <= 1) {
    healthScore = 'good';
  } else if (executionRate <= 130 || criticalCategories <= 2) {
    healthScore = 'warning';
  } else {
    healthScore = 'critical';
  }

  // ============ INCOME/EXPENSE BREAKDOWNS (compat) ============
  const expenseBreakdown = categoryHealth.map(c => ({
    categoryId: c.categoryId,
    categoryName: c.categoryName,
    amount: c.actual,
    percentage: c.weight,
    transactionCount: monthTx.filter(t => t.categoryId === c.categoryId && t.type === TransactionType.OUT).length
  }));

  const incomeByCategory: Record<string, { name: string; amount: number; count: number }> = {};
  monthTx.filter(t => t.type === TransactionType.IN).forEach(t => {
    const cat = categories.find(c => c.id === t.categoryId);
    if (!incomeByCategory[t.categoryId]) {
      incomeByCategory[t.categoryId] = { name: cat?.name || 'Sin Categoría', amount: 0, count: 0 };
    }
    incomeByCategory[t.categoryId].amount += t.amount;
    incomeByCategory[t.categoryId].count++;
  });

  const incomeBreakdown = Object.entries(incomeByCategory).map(([id, data]) => ({
    categoryId: id,
    categoryName: data.name,
    amount: data.amount,
    percentage: totalIn > 0 ? (data.amount / totalIn) * 100 : 0,
    transactionCount: data.count
  }));

  return {
    month,
    year,
    entityName,
    generatedAt: new Date().toISOString(),
    totalIn,
    totalOut,
    netBalance,
    totalPlanned,
    totalUnbudgeted,
    executionRate,
    healthScore,
    topExceeded,
    topSaved,
    comparison: {
      prevMonth: prevMonthTx.length > 0 ? { totalIn: prevTotalIn, totalOut: prevTotalOut, netBalance: prevTotalIn - prevTotalOut } : null,
      avg3M: prev3MonthsTx.some(arr => arr.length > 0) ? avg3M : null,
      deltaPrevMonth: prevTotalOut > 0 ? ((totalOut - prevTotalOut) / prevTotalOut) * 100 : 0,
      delta3M: avg3M.totalOut > 0 ? ((totalOut - avg3M.totalOut) / avg3M.totalOut) * 100 : 0
    },
    categoryHealth,
    exceedDrivers,
    forecastScore: {
      withinTolerance: withinTolerancePct,
      totalDeviation: totalDeviationPct,
      absoluteDeviation,
      rank: forecastRank
    },
    riskAlerts: riskAlerts.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    recommendedActions: recommendedActions.slice(0, 5),
    forecast: {
      projectedClose,
      nextMonthRecommendation: Math.max(totalPlanned, projectedClose) * 1.05,
      adjustmentsByCategory
    },
    cashPosition: {
      openingBalance,
      closingBalance,
      netCashChange: closingBalance - openingBalance,
      burnRate
    },
    incomeBreakdown,
    expenseBreakdown
  };
};
