export enum BusinessType {
  RESTAURANT = 'Restaurante',
  BAR = 'Bar',
  CAFE = 'Café',
  PANADERIA = 'Panadería',
  DARK_KITCHEN = 'Dark Kitchen',
  HOTEL = 'Hotel',
  OTRO = 'Otro'
}

export enum DiagnosticStatus {
  GREEN = 'Verde',
  YELLOW = 'Amarillo',
  RED = 'Rojo'
}

export interface QuickDiagnosticData {
  businessType: BusinessType;
  city: string;
  dailyCovers: number;
  openDays: number;
  
  // Lead / Contact Info
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessName: string; // Explicit name of the venue

  // Financials
  monthlyRevenue: number;
  cogs: number; // Cost of Goods Sold
  laborCost: number;
  rent: number;
  utilitiesAndFixed: number;
  
  // Qualitative
  primaryConcern: string[]; 
  methodologyScores: Record<string, number>; // 7P answers 1-5
}

export interface QuickDiagnosticResult {
  status: DiagnosticStatus;
  scoreGlobal: number;
  scoreFinancial: number;
  score7P: number;
  
  cogsPercentage: number;
  laborPercentage: number;
  fixedPercentage: number;
  marginPercentage: number;
  
  profileName: string;
  profileDescription: string;
  
  strengths: string[];
  priorities: string[];
  
  // Lead info passed through to result
  leadData?: {
    name: string;
    email: string;
    phone: string;
    business: string;
  };
  date?: string;
}

export interface DeepDiagnosticInput {
  month: string;
  salesFood: number;
  salesBeverage: number;
  salesOther: number;
  discounts: number;
  
  costFood: number;
  costBeverage: number;
  inventoryAdjustment: number;
  
  laborKitchen: number;
  laborService: number;
  laborSocial: number;
  laborOther: number;
  
  services: number;
  rent: number;
  taxes: number;
  fees: number;
  otherFixed: number;
}

export interface DeepDiagnosticResult extends DeepDiagnosticInput {
  id: string;
  totalSales: number;
  totalCogs: number;
  totalLabor: number;
  totalFixed: number;
  grossMargin: number;
  netResult: number;
  cogsPercentage: number;
  laborPercentage: number;
  fixedPercentage: number;
  breakEvenPoint: number;
}

export interface User {
  email: string;
  name: string;
  businessName: string;
}

// --- ACADEMY TYPES ---

export type ResourceType = 'video' | 'guide' | 'template' | 'case';
export type ResourceTopic = 'finanzas' | 'operaciones' | 'equipo' | 'marketing' | 'tecnologia' | 'cliente';

export interface AcademyResource {
  id: string;
  title: string;
  type: ResourceType;
  duration: string; // "10 min", "Lectura 5 min"
  topics: ResourceTopic[];
  letters7p: string[]; // ['O', 'P']
  summary: string; // The "short description"
  description: string; // Full "En cristiano" text
  idealFor: string[]; // List of user personas
  actionSteps: string[]; // 3 bullet points
  downloadUrl?: string; // If template/guide
  youtubeId?: string; // If video
  recommendedTrigger?: string[]; // Internal logic codes e.g. ['high_cogs', 'low_order']
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  resourceIds: string[];
}

// --- TICKER TYPES ---

export interface GastronomicEvent {
  id: string;
  tipo: 'feriado' | 'fecha_comercial' | 'clima' | 'precios_insumos' | 'tendencia_consumo' | 'operacion' | 'proveedores' | 'tip_gestion' | 'feriado_local' | 'feriado_nacional';
  fecha_inicio: string;
  fecha_fin: string;
  mensaje?: string; // For simple format
  titulo?: string; // For structured format
  recomendacion?: string; // For structured format
  prioridad: 1 | 2 | 3;
  regiones?: string[];
  visible_desde?: string;
  visible_hasta?: string;
}