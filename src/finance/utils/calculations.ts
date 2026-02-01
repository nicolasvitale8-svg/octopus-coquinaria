import { Jar, JarCalculation, Transaction, TransactionType, Account, MonthlyBalance, BudgetItem } from '../financeTypes';

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

import { MonthSummary, YearSummary, CategoryBreakdown, MonthReport, Category } from '../financeTypes';

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

