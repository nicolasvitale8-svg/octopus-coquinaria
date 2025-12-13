import { QuickDiagnosticResult, DeepDiagnosticResult } from '../types';
import { supabase } from './supabase';
import { runWithRetryAndTimeout } from './network';

const STORAGE_KEY = 'octopus_diagnostic_result';
const HISTORY_KEY = 'octopus_diagnostic_history';

// --- SAVE FUNCTIONS ---

export const saveDiagnosticResult = async (result: QuickDiagnosticResult) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));

    const historyEntry = {
      ...result,
      date: new Date().toISOString(),
      type: 'quick'
    };

    saveToHistory(historyEntry);

    const client = supabase;
    if (client) {
      try {
        const response = await runWithRetryAndTimeout(
          () =>
            new Promise((resolve, reject) => {
              client
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
                ])
                .then(resolve, reject);
            }),
          { timeoutMs: 8000, retries: 2, backoffMs: 1200, label: 'Guardar lead' }
        ) as any;

        if (response.error) {
          console.error('? Supabase Save Error:', response.error);
          if (response.error.code === '42P01') {
            console.warn(
              "?? LA TABLA 'diagnosticos_express' NO EXISTE. Copia el contenido de 'database_setup.sql' y ejecútalo en el SQL Editor de Supabase."
            );
          }
        }
      } catch (error) {
        console.error('? Supabase Save Error (retry):', error);
      }
    }
  } catch (error) {
    console.error('Error saving diagnostic', error);
  }
};

export const saveDeepDiagnosticResult = (result: DeepDiagnosticResult) => {
  try {
    const historyEntry = {
      date: new Date().toISOString(),
      monthLabel: result.month,
      monthlyRevenue: result.totalSales,
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
    console.error('Error saving deep diagnostic', error);
    return false;
  }
};

const saveToHistory = (entry: any) => {
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
        supabaseData = response.data.map((row: any) => ({
          id: row.id,
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
      console.warn('⚠️ Supabase fetch failed. Falling back to LocalStorage.', error?.message || error);
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
  const client = supabase;
  if (!client) return;

  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    if (!historyData) return;

    const localLeads: any[] = JSON.parse(historyData);
    const leadsToSync = localLeads.filter(h => h.type === 'quick' || !h.type);
    if (leadsToSync.length === 0) return;

    const dbRows = leadsToSync.map(result => ({
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

    try {
      const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
        setTimeout(() => resolve({ timeout: true }), 60000);
      });

      const syncPromise = client
        .from('diagnosticos_express')
        .upsert(dbRows, { onConflict: 'created_at', ignoreDuplicates: true });

      const result = await Promise.race([syncPromise, timeoutPromise]);

      if ('timeout' in result) {
        console.error("❌ Lead Sync Timed Out.");
      } else {
        const { error } = result as any;
        if (error) {
          console.error('❌ Lead Sync Failed:', error.message);
        } else {
          console.log('✅ Leads synced successfully!');
        }
      }
    } catch (error) {
      console.error('❌ Lead Sync Failed (retry):', error);
    }
  } catch (e) {
    console.error('Lead sync exception', e);
  }
};

export const deleteLead = async (lead: any): Promise<void> => {
  // 1. Optimistic Local Delete
  try {
    const historyData = localStorage.getItem(HISTORY_KEY);
    if (historyData) {
      const history = JSON.parse(historyData);
      const newHistory = history.filter((h: any) => h.date !== lead.date);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      console.log('Lead deleted from LocalStorage (Optimistic)');
    }
  } catch (e) {
    console.error('Error deleting from local storage', e);
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
          console.log('Lead deleted from Supabase (Background)');
        } catch (error) {
          console.error('Error deleting lead from Supabase:', error);
          // Optional: Could revert local change here if strict consistency is needed, 
          // but for delete it's usually better to just log error or retry later.
        }
      })();
    }
  }
};
