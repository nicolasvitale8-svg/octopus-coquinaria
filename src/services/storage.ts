import { QuickDiagnosticResult, DeepDiagnosticResult, Lead, LeadData } from '../types';
import { supabase } from './supabase';
import { runWithRetryAndTimeout } from './network';
import { logger } from './logger';

const STORAGE_KEY = 'octopus_diagnostic_result';
const HISTORY_KEY = 'octopus_diagnostic_history';

// Full data embedded in diagnosticos_express
interface DBFullData {
  profileName?: string;
  profileDescription?: string;
  status?: string;
  scoreGlobal?: number;
  cogsPercentage?: number;
  laborPercentage?: number;
  marginPercentage?: number;
  monthlyRevenue?: number;
  cogs?: number;
  laborCost?: number;
  leadData?: LeadData;
}

// Database row type for diagnosticos_express
interface DBDiagnosticRow {
  id: string;
  created_at?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  business_name?: string;
  profile_name?: string;
  profile_description?: string;
  status?: string;
  score_global?: number;
  cogs_percentage?: number;
  labor_percentage?: number;
  margin_percentage?: number;
  monthly_revenue?: number;
  full_data?: DBFullData;
  source?: string;
}

// --- SAVE FUNCTIONS ---

export const saveDiagnosticResult = async (result: QuickDiagnosticResult) => {
  try {
    // Ensure ID exists (for sync stability)
    if (!result.id) {
      result.id = crypto.randomUUID();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

    const historyEntry = {
      ...result,
      id: result.id,
      date: new Date().toISOString(),
      type: 'quick'
    };

    saveToHistory(historyEntry);

    // NOTE: Redundant Supabase insert removed here to avoid duplicates.
    // QuickDiagnostic.tsx already performs the insert with full auth context.
  } catch (error) {
    logger.error('Error saving diagnostic locally', { context: 'Storage', data: error });
  }
};

export const saveDeepDiagnosticResult = (result: DeepDiagnosticResult) => {
  // ... existing saveDeepDiagnosticResult ...
  try {
    const historyEntry = {
      date: new Date().toISOString(),
      monthLabel: result.month,
      monthlyDescription: result.totalSales,
      monthlyRevenue: result.totalSales, // Ensure consistency
      cogsPercentage: result.cogsPercentage,
      laborPercentage: result.laborPercentage,
      marginPercentage: result.netResult > 0 ? (result.netResult / result.totalSales) * 100 : 0,
      result: result.netResult > 0 ? (result.netResult / result.totalSales) * 100 : 0,
      type: 'deep',
      full_data: result
    };

    saveToHistory(historyEntry);
    return true;
  } catch (error) {
    logger.error('Error saving deep diagnostic', { context: 'Storage', data: error });
    return false;
  }
};

const saveToHistory = (entry: Lead | Record<string, unknown>) => {
  const historyStr = localStorage.getItem(HISTORY_KEY);
  const history = historyStr ? JSON.parse(historyStr) : [];
  const newHistory = [entry, ...history].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

// --- READ FUNCTIONS ---

export const getLastDiagnostic = (): QuickDiagnosticResult | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const getDiagnosticHistory = (): Lead[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// --- ADMIN FUNCTIONS ---

/**
 * Fetch diagnostics specifically for the current authenticated user (Lead/User role).
 */
export const getMyLeads = async (email: string): Promise<Lead[]> => {
  const client = supabase;
  if (!client || !email) return [];

  try {
    const { data, error } = await client
      .from('diagnosticos_express')
      .select('*')
      .eq('contact_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: DBDiagnosticRow): Lead => {
      // Prioritize data from full_data (most complete) but use columns as robust fallbacks
      const fd = row.full_data || {};
      const monthlyRev = fd.monthlyRevenue || 0;
      const cogs = fd.cogs || 0;
      const laborCost = fd.laborCost || 0;
      return {
        id: row.id,
        date: row.created_at || new Date().toISOString(),
        profileName: row.profile_name || fd.profileName || 'Diagnóstico',
        profileDescription: row.profile_description || fd.profileDescription || '',
        status: row.status || fd.status || 'Amarillo',
        scoreGlobal: row.score_global ?? fd.scoreGlobal ?? 0,
        cogsPercentage: row.cogs_percentage ?? fd.cogsPercentage ?? (monthlyRev > 0 ? (cogs / monthlyRev * 100) : 0),
        laborPercentage: row.labor_percentage ?? fd.laborPercentage ?? (monthlyRev > 0 ? (laborCost / monthlyRev * 100) : 0),
        marginPercentage: row.margin_percentage ?? fd.marginPercentage ?? 0,
        leadData: {
          business: row.business_name || fd.leadData?.business || 'Anonimo',
          name: row.contact_name || fd.leadData?.name || 'Anonimo',
          email: row.contact_email || fd.leadData?.email || '',
          phone: row.contact_phone || fd.leadData?.phone || ''
        }
      };
    });
  } catch (error) {
    logger.error('Error fetching my leads', { context: 'Storage', data: error });
    return [];
  }
};

export const getAllLeads = async (): Promise<Lead[]> => {
  let supabaseData: Lead[] | null = null;

  const client = supabase;
  if (client) {
    try {
      const response = await runWithRetryAndTimeout(
        () =>
          new Promise((resolve, reject) => {
            client
              .from('diagnosticos_express')
              .select('*')
              .order('created_at', { ascending: false })
              .then(resolve, reject);
          }),
        { timeoutMs: 60000, retries: 2, backoffMs: 2000, label: 'Cargar leads' }
      ) as any;

      if (response.error) throw response.error;

      if (response.data) {
        supabaseData = (response.data as DBDiagnosticRow[]).map((row): Lead => ({
          id: row.id,
          date: row.created_at || new Date().toISOString(),
          profileName: row.profile_name,
          profileDescription: row.full_data?.profileDescription || '',
          status: row.status,
          scoreGlobal: row.score_global || 0,
          cogsPercentage: row.cogs_percentage || 0,
          laborPercentage: row.labor_percentage || 0,
          marginPercentage: row.margin_percentage || row.full_data?.marginPercentage || 0,
          leadData: {
            business: row.business_name,
            name: row.contact_name,
            email: row.contact_email,
            phone: row.contact_phone
          }
        }));
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.warn('Supabase fetch failed, falling back to LocalStorage', { context: 'Storage', data: err.message });
    }
  }

  if (supabaseData) {
    return supabaseData;
  }

  const history = getDiagnosticHistory();
  return history.filter(h => h.type === 'quick' || !h.type);
};

export const clearDiagnostic = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const syncLocalLeads = async (): Promise<void> => {
  const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  // 1. Get Local Data
  const historyData = localStorage.getItem(HISTORY_KEY);
  if (!historyData) return;

  const localLeads: any[] = JSON.parse(historyData);
  const leadsToSync = localLeads.filter(h => h.type === 'quick' || !h.type);

  if (leadsToSync.length === 0) return;

  logger.info(`Syncing ${leadsToSync.length} leads via RAW FETCH`, { context: 'Storage' });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logger.error('Missing Supabase constants for REST sync', { context: 'Storage' });
    return;
  }

  // 2. Prepare Data
  const dbRows = leadsToSync.map(result => ({
    id: result.id, // CRITICAL: Send ID for UPSERT to work (otherwise we get duplicates)
    business_name: result.leadData?.business || 'Anonimo',
    contact_name: result.leadData?.name || 'Anonimo',
    contact_email: result.leadData?.email || '',
    contact_phone: result.leadData?.phone || '',
    profile_name: result.profileName || 'Desconocido',
    status: result.status || 'Amarillo',
    score_global: result.scoreGlobal || 0,
    cogs_percentage: result.cogsPercentage || 0,
    labor_percentage: result.laborPercentage || 0,
    margin_percentage: result.marginPercentage || 0,
    full_data: result,
    created_at: result.date || new Date().toISOString()
  }));

  // 3. NUCLEAR OPTION: Raw Fetch
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/diagnosticos_express`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "resolution=merge-duplicates" // UPSERT equivalent
      },
      body: JSON.stringify(dbRows)
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Raw Sync Failed (Leads)', { context: 'Storage', data: { status: response.status, error: errorText } });
    } else {
      logger.success('All leads synced successfully via REST', { context: 'Storage' });
    }

  } catch (e) {
    logger.error('Raw Sync Exception (Leads)', { context: 'Storage', data: e });
  }
};

export const deleteLead = async (lead: Lead): Promise<void> => {
  // 1. Optimistic Local Delete
  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    if (historyData) {
      const history = JSON.parse(historyData) as Lead[];
      const newHistory = history.filter((h) => h.date !== lead.date);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      logger.success('Lead deleted from LocalStorage', { context: 'Storage' });
    }
  } catch (e) {
    logger.error('Error deleting from local storage', { context: 'Storage', data: e });
  }

  // 2. Background Sync
  if (lead.id) {
    const client = supabase;
    if (client) {
      // Execute in background
      (async () => {
        try {
          await runWithRetryAndTimeout(
            () =>
              new Promise((resolve, reject) => {
                client
                  .from('diagnosticos_express')
                  .delete()
                  .eq('id', lead.id)
                  .then(resolve, reject);
              }),
            { timeoutMs: 30000, retries: 3, backoffMs: 2000, label: 'Eliminar lead (Background)' }
          );
          logger.success('Lead deleted from Supabase (Background)', { context: 'Storage' });
        } catch (error) {
          logger.error('Error deleting lead from Supabase', { context: 'Storage', data: error });
        }
      })();
    }
  }
};
