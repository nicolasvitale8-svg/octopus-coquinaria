
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
            // MAP SERVER DATA (Spanish -> English)
            const mappedServerData: Resource[] = data.map((r: any) => ({
                id: r.id,
                title: r.titulo,
                type: r.tipo,
                url: r.url,
                thumbnail_url: r.thumbnail_url,
                description: r.descripcion,
                es_premium: r.es_premium,
                created_at: r.created_at,
                // Optional fields mock
                topics: [],
                summary: r.descripcion
            }));

            const serverIds = new Set(mappedServerData.map(r => r.id));
            const uniqueLocal = localResources.filter(r => !serverIds.has(r.id));
            const combined = [...mappedServerData, ...uniqueLocal];

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

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

/**
 * Sync all local resources to Supabase
 */
export const syncLocalResources = async (): Promise<void> => {
    // 1. Get Local Data
    const localResources = getLocalResources();
    if (localResources.length === 0) return;

    console.log(`🔄 Syncing ${localResources.length} academy resources via RAW FETCH...`);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) { return; }

    // 2. Prepare Data (Map English/Spanish Mixed Keys)
    const dbRows = localResources.map((r: any) => {
        // Determine URL
        let finalUrl = r.url || '';
        if (!finalUrl && r.youtubeId) finalUrl = `https://www.youtube.com/watch?v=${r.youtubeId}`;
        if (!finalUrl && r.downloadUrl) finalUrl = r.downloadUrl;

        return {
            id: r.id,
            titulo: r.title || r.titulo || 'Sin Título', // Robust check
            tipo: r.type || r.tipo || 'guia',           // Robust check
            url: finalUrl,
            thumbnail_url: r.thumbnail_url || null,
            descripcion: r.description || r.descripcion || r.summary || '', // Robust check
            es_premium: r.es_premium || false,
            created_at: r.created_at || new Date().toISOString()
        };
    });

    // 3. RAW FETCH
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/recursos_academia`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
                "Prefer": "resolution=merge-duplicates" // Upsert on ID
            },
            body: JSON.stringify(dbRows)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Raw Sync Failed (Academy): ${response.status}`, errorText);
        } else {
            console.log("✅ Academy synced successfully via REST!");
        }
    } catch (e) {
        console.error("❌ Raw Sync Exception (Academy):", e);
    }
};
