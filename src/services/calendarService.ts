
import { supabase } from './supabase';

// Define Interface locally or import if available in types.ts (prefer types.ts if exists)
// Based on previous chats, it seems user has a Calendar event type.
// Let's check typical structure or just use 'any' temporarily if types aren't clear, 
// BUT better to check usage in AdminCalendar.tsx first. 
// For now, I'll infer from the error message "eventos_calendario".

export interface CalendarEvent {
    id: string; // UUID
    title: string;
    description?: string;
    start_date: string; // ISO
    end_date?: string; // ISO
    type: 'feriado' | 'comercial' | 'interno';
    created_at?: string;
    author_id?: string;
    business_id?: string; // New: For private business events
}

const CALENDAR_STORAGE_KEY = 'octopus_calendar_local';

/**
 * Fetch events. Local + Supabase.
 */
/**
 * Get events from LocalStorage immediately.
 */
export const getLocalEvents = (): CalendarEvent[] => {
    try {
        const localData = localStorage.getItem(CALENDAR_STORAGE_KEY);
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Fetch events from Supabase, merge with local, and return.
 */
export const getEvents = async (): Promise<CalendarEvent[]> => {
    let localEvents = getLocalEvents();

    if (!supabase) return localEvents;

    try {
        const { data, error } = await supabase
            .from('eventos_calendario')
            .select('*');

        if (error) {
            console.warn("Supabase calendar fetch failed (RLS?):", error.message);
            return localEvents; // Fallback to local
        }

        if (data) {
            // Merge strategy: Server wins + Local unique
            // MAP SERVER DATA (Spanish -> English)
            const mappedServerData: CalendarEvent[] = data.map((e: any) => ({
                id: e.id,
                title: e.titulo,
                description: e.mensaje,
                start_date: e.fecha_inicio,
                end_date: e.fecha_fin,
                type: e.tipo, // 'feriado', 'comercial', etc. matches
                created_at: e.created_at,
                business_id: e.business_id // Map from DB
            }));

            const serverIds = new Set(mappedServerData.map(e => e.id));
            const uniqueLocal = localEvents.filter(e => !serverIds.has(e.id));
            const combined = [...mappedServerData, ...uniqueLocal];

            // Sync local cache
            localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(combined));
            return combined;
        }
    } catch (e) {
        console.error(e);
    }

    return localEvents;
};

/**
 * Create event. Safe offline.
 */
/**
 * Create event. Safe offline. Optimistic.
 */
export const createEvent = async (event: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent | null> => {
    const newEvent: CalendarEvent = {
        ...event,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
    };

    // 1. Save Local
    try {
        const localData = localStorage.getItem(CALENDAR_STORAGE_KEY);
        const currentList: CalendarEvent[] = localData ? JSON.parse(localData) : [];
        const newList = [...currentList, newEvent];
        localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newList));
        console.log("✅ Event saved locally");
    } catch (e) {
        console.error("Error saving local event", e);
    }

    // 2. Sync Supabase (Background)
    if (supabase) {
        (async () => {
            try {
                const { error } = await supabase.from('eventos_calendario').insert([newEvent]);
                if (error) console.warn("Background Sync: Supabase insert failed:", error.message);
                else console.log("Background Sync: Event synced to Supabase");
            } catch (e) {
                console.error("Background Sync exception", e);
            }
        })();
    }

    return newEvent;
};

/**
 * Delete event.
 */
export const deleteEvent = async (id: string): Promise<void> => {
    // 1. Local Delete
    try {
        const localData = localStorage.getItem(CALENDAR_STORAGE_KEY);
        if (localData) {
            const list: CalendarEvent[] = JSON.parse(localData);
            const newList = list.filter(e => e.id !== id);
            localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newList));
        }
    } catch (e) { console.error(e); }

    // 2. Supabase Delete
    if (supabase) {
        try {
            await supabase.from('eventos_calendario').delete().eq('id', id);
        } catch (e) { console.warn(e); }
    }
};

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

/**
 * Sync all local events to Supabase
 */
export const syncLocalEvents = async (): Promise<void> => {
    // 1. Get Local Data
    const localEvents = getLocalEvents();
    if (localEvents.length === 0) return;

    console.log(`🔄 Syncing ${localEvents.length} calendar events via RAW FETCH...`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { return; }

    // 2. Prepare Data (Map keys: description -> mensaje, robust check)
    const dbRows = localEvents.map((e: any) => ({
        id: e.id,
        titulo: e.title || e.titulo || 'Sin Título',
        tipo: e.type || e.tipo || 'comercial',
        fecha_inicio: e.start_date || e.fecha_inicio || new Date().toISOString(),
        fecha_fin: e.end_date || e.fecha_fin || e.start_date || new Date().toISOString(),
        mensaje: e.description || e.mensaje || '', // Robust mapping
        prioridad: e.priority || e.prioridad || 1,
        created_at: e.created_at || new Date().toISOString(),
        business_id: e.business_id || null
    }));

    // 3. RAW FETCH
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/eventos_calendario`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "resolution=merge-duplicates" // Upsert on ID
            },
            body: JSON.stringify(dbRows) // Send mapped rows
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Raw Sync Failed (Calendar): ${response.status}`, errorText);
        } else {
            console.log("✅ Calendar synced successfully via REST!");
        }
    } catch (e) {
        console.error("❌ Raw Sync Exception (Calendar):", e);
    }
};
