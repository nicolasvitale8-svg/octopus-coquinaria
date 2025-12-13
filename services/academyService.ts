
import { supabase } from './supabase';

export interface Resource {
    id: string;
    titulo: string;
    tipo: 'video' | 'plantilla' | 'guia';
    url: string;
    thumbnail_url?: string;
    descripcion?: string;
    es_premium: boolean;
    created_at: string;
    topics?: string[];
}

const ACADEMY_STORAGE_KEY = 'octopus_academy_cache';

/**
 * Get resources from LocalStorage immediately.
 */
export const getLocalResources = (): Resource[] => {
    try {
        const localData = localStorage.getItem(ACADEMY_STORAGE_KEY);
        return localData ? JSON.parse(localData) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Fetch resources from Supabase, merge with local, and return.
 */
export const getResources = async (): Promise<Resource[]> => {
    let localResources = getLocalResources();

    if (!supabase) return localResources;

    try {
        const { data, error } = await supabase
            .from('recursos_academia')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Supabase academy fetch failed:", error.message);
            return localResources;
        }

        if (data) {
            // Merge strategy: Server wins + Local unique
            const serverIds = new Set(data.map(r => r.id));
            const uniqueLocal = localResources.filter(r => !serverIds.has(r.id));
            const combined = [...data, ...uniqueLocal] as Resource[];

            localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(combined));
            return combined;
        }
    } catch (e) {
        console.error(e);
    }

    return localResources;
};

/**
 * Create resource. Safe offline. Optimistic.
 */
export const createResource = async (resource: Omit<Resource, 'id' | 'created_at'>): Promise<Resource> => {
    const newResource: Resource = {
        id: crypto.randomUUID(),
        ...resource,
        created_at: new Date().toISOString()
    };

    // 1. Save Local
    try {
        const currentList = getLocalResources();
        const newList = [newResource, ...currentList];
        localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
        console.error("Error saving local resource", e);
    }

    // 2. Sync Supabase (Background)
    if (supabase) {
        (async () => {
            try {
                const { error } = await supabase.from('recursos_academia').insert([newResource]);
                if (error) console.warn("Background Sync: Academy insert failed:", error.message);
            } catch (e) {
                console.error("Background Sync exception", e);
            }
        })();
    }

    return newResource;
};

/**
 * Delete resource.
 */
export const deleteResource = async (id: string): Promise<void> => {
    // 1. Local
    const list = getLocalResources();
    const newList = list.filter(r => r.id !== id);
    localStorage.setItem(ACADEMY_STORAGE_KEY, JSON.stringify(newList));

    // 2. Remote
    if (supabase) {
        (async () => {
            try {
                await supabase.from('recursos_academia').delete().eq('id', id);
            } catch (e) { console.error(e); }
        })();
    }
};

/**
 * Sync all local resources to Supabase
 */
export const syncLocalResources = async (): Promise<void> => {
    if (!supabase) return;

    try {
        const localResources = getLocalResources();
        if (localResources.length === 0) return;

        console.log(`🔄 Syncing ${localResources.length} academy resources...`);

        // TIMEOUT WRAPPER
        const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
            setTimeout(() => resolve({ timeout: true }), 60000);
        });

        const syncPromise = supabase
            .from('recursos_academia')
            .upsert(localResources, { onConflict: 'id' });

        const result = await Promise.race([syncPromise, timeoutPromise]);

        if ('timeout' in result) {
            console.error("❌ Academy Sync Timed Out.");
        } else {
            const { error } = result as any;
            if (error) console.error("❌ Academy Sync Failed:", error.message);
            else console.log("✅ Academy synced successfully!");
        }
    } catch (e) {
        console.error("Academy sync exception", e);
    }
};
