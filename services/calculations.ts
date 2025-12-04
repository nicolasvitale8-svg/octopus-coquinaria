import { DeepDiagnosticInput, DeepDiagnosticResult, QuickDiagnosticData, QuickDiagnosticResult, DiagnosticStatus } from '../types';

// --- DEEP DIAGNOSTIC ---

export const calculateDeepDiagnostic = (input: DeepDiagnosticInput): DeepDiagnosticResult => {
  const totalSales = (input.salesFood + input.salesBeverage + input.salesOther) - input.discounts;
  const totalCogs = input.costFood + input.costBeverage + input.inventoryAdjustment;
  const totalLabor = input.laborKitchen + input.laborService + input.laborSocial + input.laborOther;
  const totalFixed = input.services + input.rent + input.taxes + input.fees + input.otherFixed;

  const grossMargin = totalSales - totalCogs;
  const netResult = grossMargin - totalLabor - totalFixed;

  // Avoid division by zero
  const safeDiv = (num: number, den: number) => (den === 0 ? 0 : (num / den) * 100);

  const cogsPercentage = safeDiv(totalCogs, totalSales);
  const laborPercentage = safeDiv(totalLabor, totalSales);
  const fixedPercentage = safeDiv(totalFixed, totalSales);

  // Break Even Point
  const contributionMarginRatio = (totalSales - totalCogs) / totalSales;
  const breakEvenPoint = contributionMarginRatio > 0 ? (totalLabor + totalFixed) / contributionMarginRatio : 0;

  return {
    ...input,
    id: Date.now().toString(),
    totalSales,
    totalCogs,
    totalLabor,
    totalFixed,
    grossMargin,
    netResult,
    cogsPercentage,
    laborPercentage,
    fixedPercentage,
    breakEvenPoint
  };
};

// --- QUICK DIAGNOSTIC ENGINE ---

export const calculateQuickDiagnostic = (data: QuickDiagnosticData): QuickDiagnosticResult => {
  const revenue = data.monthlyRevenue || 0;
  
  // 1. Calculate Financial Percentages
  // Handle edge case of 0 revenue to avoid Infinity
  const cogsPct = revenue > 0 ? (data.cogs / revenue) * 100 : 0;
  const laborPct = revenue > 0 ? (data.laborCost / revenue) * 100 : 0;
  const fixedPct = revenue > 0 ? ((data.rent + data.utilitiesAndFixed) / revenue) * 100 : 0;
  const marginPct = 100 - (cogsPct + laborPct + fixedPct);

  // 2. Financial Scoring (Traffic Lights -> Points)
  // COGS: Green <= 35, Yellow <= 40, Red > 40
  const cogsScore = cogsPct <= 35 ? 100 : (cogsPct <= 40 ? 60 : 20);
  
  // Labor: Green <= 25, Yellow <= 30, Red > 30
  const laborScore = laborPct <= 25 ? 100 : (laborPct <= 30 ? 60 : 20);
  
  // Margin: Green >= 15, Yellow >= 5, Red < 5
  const marginScore = marginPct >= 15 ? 100 : (marginPct >= 5 ? 60 : 20);

  const scoreFinancial = (cogsScore + laborScore + marginScore) / 3;

  // 3. 7P Scoring
  // Average of 1-5 scores normalized to 0-100
  const scores = Object.values(data.methodologyScores);
  const avgRawScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  
  // Correct Normalization: (val - 1) / (max - min) * 100
  // Scale 1-5 maps to 0-100. 1 -> 0%, 3 -> 50%, 5 -> 100%
  const score7P = scores.length > 0 ? ((avgRawScore - 1) / 4) * 100 : 0;

  // 4. Global Score (70% Financial, 30% 7P)
  const scoreGlobal = (scoreFinancial * 0.7) + (score7P * 0.3);

  // 5. Determine Status
  let status = DiagnosticStatus.GREEN;
  if (scoreGlobal < 50) status = DiagnosticStatus.RED; // Slightly stricter threshold (was 45)
  else if (scoreGlobal < 75) status = DiagnosticStatus.YELLOW;

  // 6. Profile Detection Logic
  let profileName = "En zona gris";
  let profileDescription = "No estás incendiado, pero hay puntos que te están frenando. Falta definición en tu modelo.";

  // Profile: Cocina en llamas (Bad COGS & Bad Margin)
  if (cogsScore === 20 && marginScore === 20) {
    profileName = "Cocina en llamas";
    profileDescription = "La cocina te está comiendo la rentabilidad. No es que falten ventas: falta control de compras, porciones y mermas.";
  }
  // Profile: Artista pobre (Bad Labor & Low Pragmatism)
  else if ((laborScore <= 60) && (data.methodologyScores['P'] || 0) <= 2) {
    profileName = "Artista pobre";
    profileDescription = "Tenés una propuesta que probablemente guste, pero el negocio no está pensado como negocio. Mucho corazón, poco margen.";
  }
  // Profile: Pulpo atado (Low Tech/Observation & Bad Financials)
  else if (((data.methodologyScores['T'] || 0) <= 2 || (data.methodologyScores['O_obs'] || 0) <= 2) && scoreFinancial < 80) {
    profileName = "Pulpo atado";
    profileDescription = "Tenés un buen potencial, pero estás manejando todo a ciegas. Mientras no mires números, estás con los tentáculos atados.";
  }
  // Profile: Piloto automático (Good Financials but Low Creativity/Subtlety)
  else if (scoreFinancial >= 80 && ((data.methodologyScores['C'] || 0) <= 2 || (data.methodologyScores['S'] || 0) <= 2)) {
    profileName = "Piloto automático";
    profileDescription = "Los números no están mal, pero si no renovás propuesta ni afinás la experiencia, te vas a quedar atrás.";
  }

  // 7. Priorities & Strengths
  const priorities: string[] = [];
  
  // Financial Priorities
  if (cogsPct > 35) priorities.push(`Bajar tu costo de mercadería urgente (está en ${cogsPct.toFixed(1)}%).`);
  if (laborPct > 30) priorities.push("Revisar la eficiencia de tu personal y turnos.");
  if (marginPct < 5) priorities.push("Revisar tu estructura de precios y costos fijos.");

  // 7P Methodology Priorities
  if ((data.methodologyScores['O'] || 0) <= 3) priorities.push("Implementar checklists de apertura y cierre para ordenar la operación.");
  if ((data.methodologyScores['T'] || 0) <= 3) priorities.push("Empezar a registrar ventas y gastos en un sistema o planilla.");
  if ((data.methodologyScores['O_obs'] || 0) <= 3) priorities.push("Establecer una rutina semanal de análisis de números.");
  if ((data.methodologyScores['P'] || 0) <= 3) priorities.push("Definir 3 metas numéricas claras para el mes.");
  if ((data.methodologyScores['C'] || 0) <= 3) priorities.push("Revisar la rentabilidad y concepto de la carta.");
  
  // Fill with generic if empty
  if (priorities.length === 0) priorities.push("Mantener los costos bajo control.", "Buscar oportunidades para subir el ticket promedio.");

  const strengths: string[] = [];
  if ((data.methodologyScores['O_obs'] || 0) >= 4) strengths.push("Buen hábito de observación de números.");
  if ((data.methodologyScores['T'] || 0) >= 4) strengths.push("Buen uso de tecnología/registros.");
  if ((data.methodologyScores['C'] || 0) >= 4) strengths.push("Propuesta creativa y dinámica.");
  if (cogsScore === 100) strengths.push("Excelente control de costo de mercadería.");
  
  if (strengths.length === 0) strengths.push("Voluntad de mejora (por estar acá).");

  return {
    status,
    scoreGlobal,
    scoreFinancial,
    score7P,
    cogsPercentage: cogsPct,
    laborPercentage: laborPct,
    fixedPercentage: fixedPct,
    marginPercentage: marginPct,
    profileName,
    profileDescription,
    priorities: priorities.slice(0, 3), // Top 3
    strengths: strengths.slice(0, 3)
  };
};


export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};