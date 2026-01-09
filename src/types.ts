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
  id?: string; // New: UUID for sync
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

// --- SECURITY TYPES (V3) ---

export type UserRole = 'admin' | 'consultant' | 'manager' | 'client' | 'user';

export type Permission =
  | 'view_dashboard'
  | 'view_finance_basic'
  | 'view_calendar'
  | 'view_tasks'
  | 'create_tasks'
  | 'assign_tasks'
  | 'edit_task_status'
  | 'approve_task'
  | 'upload_deliverable'
  | 'approve_deliverable'
  | 'view_finance_advanced'
  | 'manage_members'
  | 'edit_calendar'
  | 'edit_settings'
  | 'super_admin'; // Special permission for safety

export interface AppUser {
  id: string;
  email: string;
  name: string;
  full_name?: string; // Sync with DB
  role: UserRole;
  plan: 'FREE' | 'PRO';
  diagnostic_scores?: {
    costos?: number;
    operaciones?: number;
    equipo?: number;
    marketing?: number;
    tecnologia?: number;
    cliente?: number;
  };
  permissions: Permission[];
  businessIds: string[]; // memberships
  businessName?: string; // Legacy/Display
  job_title?: string;
  phone?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role_id: string;
  specialties: string[];
  permissions_override: Permission[];
  is_active: boolean;
  joined_at: string;
  usuarios?: {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    job_title?: string;
  };
  roles?: Role;
}


// --- ACADEMY TYPES v2 ---

export type ResourceFormat = 'VIDEO' | 'PDF' | 'GUIDE' | 'TIP' | 'TEMPLATE' | 'FORM';
export type ResourceCategory = 'COSTOS' | 'OPERACIONES' | 'EQUIPO' | 'MARKETING' | 'TECNOLOGIA' | 'CLIENTE';
export type ResourceImpactTag = 'QUICK_WIN' | 'HERRAMIENTA' | 'MARCO' | 'LECTURA' | 'CASO';
export type ResourceAccess = 'PUBLIC' | 'PRO';
export type ResourceTopic = 'finanzas' | 'operaciones' | 'equipo' | 'marketing' | 'tecnologia' | 'cliente' | 'general';

export interface AcademyResource {
  id: string;
  title: string;
  description: string;
  outcome: string; // "max 120 chars"
  category: ResourceCategory;
  format: ResourceFormat;
  impactTag: ResourceImpactTag;
  level: 1 | 2 | 3;
  durationMinutes: number;
  access: ResourceAccess;
  isPinned: boolean;
  pinnedOrder?: number;
  expiresAt?: string | null; // For TIPS
  createdAt: string;

  // UI/Legacy compatibility
  downloadUrl?: string;
  url2?: string;
  url3?: string;
  youtubeId?: string;
  actionSteps?: string[];
  idealFor?: string[];
  pilares?: string[]; // Para vincular con los 7 Pilares OCTOPUS

  // Impacto
  impactOutcome?: string;
  impactFormat?: string;
  impactProgram?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle?: string;
  audience: 'DUENO' | 'ENCARGADO' | 'PRODUCCION' | 'APERTURA';
  category: ResourceCategory;
  estimatedMinutes: number;
  resourceIds: string[];
  access: ResourceAccess;
  order: number;
  isPublished: boolean;
  description?: string; // Legacy comp
}

// ... existing types ...

export interface ProjectMilestone {
  name: string;
  date: string;
  status: 'pending' | 'in_progress' | 'done';
  note?: string;
}

export interface ProjectActivity {
  date: string;
  text: string;
  author: string;
}

export interface ClientContact {
  name: string;
  role: string;
  email: string;
  phone: string;
  notes?: string;
  is_team_member?: boolean;
}

// --- External Systems ---
export interface ExternalSystemAccess {
  id: string;
  name: string;
  url: string;
  type: 'POS' | 'Delivery' | 'ERP' | 'Web' | 'Backoffice' | 'Cámaras' | 'Otro';
  username?: string;
  password?: string; // Encripted or Hint
  notes?: string;
}

// --- Octopus V4: Tasks & Deliverables ---

export type TaskType = 'INTERNAL' | 'CLIENT' | 'APPROVAL' | 'REQUEST';
export type TaskStatus = 'TODO' | 'DOING' | 'BLOCKED' | 'DONE' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskVisibility = 'INTERNAL_ONLY' | 'SHARED' | 'CLIENT_ONLY';

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_by: string;
  assigned_to?: string;
  visibility: TaskVisibility;
  attachments?: string[];
  comments_count?: number;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string;
  title: string;
  file_url?: string;
  version: string;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  assigned_approver?: string;
  internal_notes?: string;
  created_at: string;
}

export interface Specialty {
  id: string;
  name: string;
  color?: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  category: 'GENERAL' | 'UPDATE' | 'ALERT' | 'MEETING' | 'INTERNAL';
  visibility: 'INTERNAL' | 'CLIENT_SHARED';
  created_at: string;
  usuarios?: {
    full_name: string;
    role: UserRole;
  };
}

export interface Project {
  // ... existing fields ...
  id: string;
  created_at: string;
  lead_id?: string;
  business_name: string;
  main_service?: string;
  lead_consultant?: string;
  phase: 'Lead' | 'Onboarding' | 'Diagnóstico' | 'Implementación' | 'Seguimiento' | 'Cerrado';
  status: 'verde' | 'amarillo' | 'rojo';
  next_action?: string;
  next_action_date?: string;
  notion_url?: string;
  chatgpt_url?: string;
  drive_url?: string;
  finanzaflow_enabled?: boolean;

  // New: Client External Systems
  external_systems?: ExternalSystemAccess[];

  summary: {
    objective?: string;
    problem?: string;
    pillars?: string[];
    services?: string[];
  };
  team: {
    consultants?: string[];
    client_rep?: string;
    client_email?: string;
    client_location?: string;
    client_contacts?: ClientContact[];
    roles?: string;
  };
  milestones: ProjectMilestone[];
  activity_log: ProjectActivity[];

  // V4 Extensions
  tasks?: ProjectTask[];
  deliverables?: Deliverable[];

  // Members from project_members (Successor of business_memberships)
  project_members?: {
    user_id: string;
    role_id: UserRole;
    specialties: string[];
    permissions_override: Permission[];
    is_active: boolean;
    usuarios: {
      id: string;
      full_name: string;
      email: string;
      role: UserRole;
      job_title?: string;
    }
  }[];

  /** @deprecated Use project_members (V4) */
  business_memberships?: any[];
}

// --- PUBLIC BOARD TYPES ---

export type NewsBoardItemType = 'TIP' | 'DESCUENTO' | 'NOVEDAD_APP' | 'RADAR';

export interface NewsBoardItem {
  id: string;
  title: string;
  type: NewsBoardItemType;
  summary: string;
  start_date: string;
  end_date: string;
  priority: 1 | 2 | 3;
  is_visible: boolean;
  cta_label?: string;
  cta_url?: string;
  tag?: string;
  created_at: string;
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