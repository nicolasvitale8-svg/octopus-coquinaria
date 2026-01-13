
import { supabase } from './supabase';
import { logger } from './logger';

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
            logger.warn('Supabase calendar fetch failed', { context: 'CalendarService', data: error.message });
            return localEvents;
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
        logger.error('Calendar getEvents exception', { context: 'CalendarService', data: e });
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
        logger.success('Event saved locally', { context: 'CalendarService' });
    } catch (e) {
        logger.error('Error saving local event', { context: 'CalendarService', data: e });
    }

    // 2. Sync Supabase (Background)
    if (supabase) {
        (async () => {
            try {
                const { error } = await supabase.from('eventos_calendario').insert([newEvent]);
                if (error) logger.warn('Background Sync: Supabase insert failed', { context: 'CalendarService', data: error.message });
                else logger.success('Background Sync: Event synced to Supabase', { context: 'CalendarService' });
            } catch (e) {
                logger.error('Background Sync exception', { context: 'CalendarService', data: e });
            }
        })();
    }

    return newEvent;
};


/**
 * Update event.
 */
export const updateEvent = async (event: CalendarEvent): Promise<CalendarEvent> => {
    // 1. Update Local
    try {
        const localData = localStorage.getItem(CALENDAR_STORAGE_KEY);
        if (localData) {
            const list: CalendarEvent[] = JSON.parse(localData);
            const index = list.findIndex(e => e.id === event.id);
            if (index !== -1) {
                list[index] = event;
                localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(list));
                logger.success('Event updated locally', { context: 'CalendarService' });
            }
        }
    } catch (e) {
        logger.error('Error updating local event', { context: 'CalendarService', data: e });
    }

    // 2. Sync Supabase (Background)
    if (supabase) {
        (async () => {
            try {
                // Map to DB columns
                const dbRow = {
                    id: event.id,
                    titulo: event.title,
                    mensaje: event.description,
                    description: event.description, // redundancy
                    fecha_inicio: event.start_date,
                    fecha_fin: event.end_date || event.start_date,
                    tipo: event.type,
                    prioridad: 1 // Default or add to interface if needed
                };

                const { error } = await supabase.from('eventos_calendario').upsert(dbRow);
                if (error) logger.warn('Background Sync: Supabase update failed', { context: 'CalendarService', data: error.message });
                else logger.success('Background Sync: Event updated in Supabase', { context: 'CalendarService' });
            } catch (e) {
                logger.error('Background Sync exception', { context: 'CalendarService', data: e });
            }
        })();
    }

    return event;
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
    } catch (e) { logger.error('Delete local event error', { context: 'CalendarService', data: e }); }

    // 2. Supabase Delete
    if (supabase) {
        try {
            await supabase.from('eventos_calendario').delete().eq('id', id);
        } catch (e) { logger.warn('Delete supabase event error', { context: 'CalendarService', data: e }); }
    }
};


/**
 * Sync all local events to Supabase
 */
export const syncLocalEvents = async (): Promise<void> => {
    // 1. Get Local Data
    const localEvents = getLocalEvents();
    if (localEvents.length === 0) return;

    if (!supabase) return;

    logger.info(`Syncing ${localEvents.length} calendar events`, { context: 'CalendarService' });

    // 2. Prepare Data
    const dbRows = localEvents.map((e: CalendarEvent) => ({
        id: e.id,
        titulo: e.title || 'Sin Título',
        tipo: e.type || 'comercial',
        fecha_inicio: e.start_date || new Date().toISOString(),
        fecha_fin: e.end_date || e.start_date || new Date().toISOString(),
        mensaje: e.description || '',
        description: e.description || '',
        prioridad: 1,
        created_at: e.created_at || new Date().toISOString(),
        business_id: e.business_id || null
    }));

    // 3. UPSERT using Supabase Client
    try {
        const { error } = await supabase
            .from('eventos_calendario')
            .upsert(dbRows, { onConflict: 'id' });

        if (error) {
            logger.error('Sync Failed (Calendar)', { context: 'CalendarService', data: error.message });
        } else {
            logger.success('Calendar synced successfully', { context: 'CalendarService' });
        }
    } catch (e) {
        logger.error('Sync Exception (Calendar)', { context: 'CalendarService', data: e });
    }
};
