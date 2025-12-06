
import { QuickDiagnosticResult, DeepDiagnosticResult } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'octopus_diagnostic_result';
const HISTORY_KEY = 'octopus_diagnostic_history';

// --- SAVE FUNCTIONS ---

export const saveDiagnosticResult = async (result: QuickDiagnosticResult) => {
  try {
    // 1. Always save to LocalStorage (Immediate user feedback / Offline mode)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

    // Normalize date for history
    const historyEntry = {
      ...result,
      date: new Date().toISOString(),
      type: 'quick'
    };

    saveToHistory(historyEntry);

    // 2. Try saving to Supabase (Cloud DB)
    if (supabase) {
      const { error } = await supabase
        .from('diagnosticos_express')
        .insert([
          {
            business_name: result.leadData?.business || 'Anonimo',
            contact_name: result.leadData?.name || 'Anonimo',
            contact_email: result.leadData?.email || '',
            contact_phone: result.leadData?.phone || '',
            profile_name: result.profileName,
            status: result.status,
            score_global: result.scoreGlobal,
            cogs_percentage: result.cogsPercentage,
            labor_percentage: result.laborPercentage,
            margin_percentage: result.marginPercentage,
            full_data: result
          }
        ]);

      if (error) {
        console.error('❌ Supabase Save Error:', error);
        if (error.code === '42P01') {
          console.warn("⚠️ LA TABLA 'diagnosticos_express' NO EXISTE. Copia el contenido de 'database_setup.sql' y ejecútalo en el SQL Editor de Supabase.");
        }
      }
    }

  } catch (error) {
    console.error('Error saving diagnostic', error);
  }
};

export const saveDeepDiagnosticResult = (result: DeepDiagnosticResult) => {
  try {
    // Save deep diagnostic as a history entry with specific fields mapped for dashboard
    const historyEntry = {
      date: new Date().toISOString(), // Use current date for sorting
      monthLabel: result.month, // Keep the analyzed month
      monthlyRevenue: result.totalSales,
      cogsPercentage: result.cogsPercentage,
      laborPercentage: result.laborPercentage,
      marginPercentage: result.netResult > 0 ? (result.netResult / result.totalSales) * 100 : 0,
      result: result.netResult > 0 ? (result.netResult / result.totalSales) * 100 : 0, // for dashboard mapping
      type: 'deep',
      full_data: result
    };

    saveToHistory(historyEntry);
    return true;
  } catch (error) {
    console.error("Error saving deep diagnostic", error);
    return false;
  }
};

// Internal helper
const saveToHistory = (entry: any) => {
  const historyStr = localStorage.getItem(HISTORY_KEY);
  const history = historyStr ? JSON.parse(historyStr) : [];
  const newHistory = [entry, ...history].slice(0, 20); // Keep last 20
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

export const getDiagnosticHistory = (): any[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// --- ADMIN FUNCTIONS ---

export const getAllLeads = async (): Promise<any[]> => {
  let supabaseData: any[] | null = null;

  // 1. Try fetching from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('diagnosticos_express')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        supabaseData = data.map(row => ({
          date: row.created_at,
          profileName: row.profile_name,
          profileDescription: row.full_data?.profileDescription || '',
          status: row.status,
          scoreGlobal: row.score_global,
          cogsPercentage: row.cogs_percentage,
          laborPercentage: row.labor_percentage,
          marginPercentage: row.margin_percentage,
          leadData: {
            business: row.business_name,
            name: row.contact_name,
            email: row.contact_email,
            phone: row.contact_phone
          },
          ...(row.full_data || {})
        }));
      }
    } catch (error: any) {
      console.warn("⚠️ Supabase fetch failed. Falling back to LocalStorage.", error.message);
    }
  }

  // If Supabase returned data, use it.
  if (supabaseData) {
    return supabaseData;
  }

  // 2. Fallback to LocalStorage
  const history = getDiagnosticHistory();
  return history.filter(h => h.type === 'quick' || !h.type); // Only return quick diagnostics as leads
}

export const clearDiagnostic = () => {
  localStorage.removeItem(STORAGE_KEY);
};
