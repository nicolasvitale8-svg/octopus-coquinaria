
import { Project } from '../types';
import { supabase } from './supabase';

const PROJECTS_STORAGE_KEY = 'octopus_projects_local';

/**
 * Fetch projects from Supabase first, fallback to LocalStorage.
 * In Dev Mode, prioritizes LocalStorage merged with Supabase if available.
 */
export const getAllProjects = async (): Promise<Project[]> => {
    let localProjects: Project[] = [];
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (localData) {
            localProjects = JSON.parse(localData);
        }
    } catch (e) {
        console.warn("Error reading local projects", e);
    }

    // Try Supabase with Timeout
    if (!supabase) return localProjects;

    try {
        // Create a timeout promise that rejects after 15 seconds (increased for debugging)
        const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
            setTimeout(() => resolve({ timeout: true }), 15000);
        });

        // The actual fetch promise
        const fetchPromise = supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        // Race them
        const result = await Promise.race([fetchPromise, timeoutPromise]);

        // Check if it was a timeout
        if ('timeout' in result) {
            console.error("❌ Supabase fetch TIMED OUT (>15s). Check internet connection or Supabase status.");
            return localProjects;
        }

        // It was a fetch result
        const { data, error } = result as any; // Cast because TS doesn't know which race won easily

        if (error) {
            console.warn("Supabase fetch failed (likely dev mode/RLS), using local only.", error.message);
            return localProjects;
        }

        if (data) {
            // Merge strategy: Server wins, but keep local-only ones if they don't exist on server
            const serverIds = new Set(data.map((p: Project) => p.id));
            const uniqueLocal = localProjects.filter(p => !serverIds.has(p.id));

            // Update local cache with EVERYTHING
            const combined = [...data, ...uniqueLocal];
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(combined));

            return combined;
        }
    } catch (e) {
        console.error("Supabase fetch exception", e);
    }

    return localProjects;
};

/**
 * Get a single project by ID.
 * Tries Supabase first, but falls back to LocalStorage if not found or error.
 */
export const getProjectById = async (id: string): Promise<Project | null> => {
    // 1. Try Local Fetch
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (localData) {
            const projects: Project[] = JSON.parse(localData);
            const localProject = projects.find(p => p.id === id);

            // If we found it locally, we can return it immediately OR try to refresh from server.
            // For Dev Mode stability, let's return it immediately if found.
            // If offline-first is priority, this is good.
            if (localProject) return localProject;
        }
    } catch (e) {
        console.warn("Error reading local project by id", e);
    }

    // 2. Try Supabase with Timeout
    if (supabase) {
        try {
            // Create a timeout promise that rejects after 5 seconds
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 5000);
            });

            const fetchPromise = supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            // Race them
            const result = await Promise.race([fetchPromise, timeoutPromise]);

            // Check if it was a timeout
            if ('timeout' in result) {
                console.warn(`⚠️ Supabase fetch project(${id}) timed out (5s). Fallback to local.`);
                // If we are here, we already tried local at step 1. 
                // We should re-return the local search execution if we didn't return early?
                // Actually step 1 returns early if found. So if we are here, local didn't have it...
                // OR we decided to sync.
                // But wait, step 1 says: "if (localProject) return localProject;"
                // So if we are here, we probably didn't find it locally.
                // Returning null is correct-ish, or we could try to re-read?
                // Actually, let's just let it return null if not in local.
                return null;
            }

            const { data, error } = result as any;

            if (data) return data;
            if (error) console.warn("Supabase fetch project by id error:", error.message);
        } catch (e) {
            console.error(e);
        }
    }

    // 3. Fallback: Mock Data (Only for testing/dev if real data missing)
    // This ensures the UI never crashes "empty" for the specific ID used in dev
    if (id === '16326af3-462f-45b7-897e-0d83461ebf46') {
        console.warn("⚠️ Project not found. Generating MOCK PROJECT for Dev/Testing.");
        return {
            id: '16326af3-462f-45b7-897e-0d83461ebf46',
            created_at: new Date().toISOString(),
            business_name: 'Proyecto Demo (Mock)',
            main_service: 'Consultoría 360',
            lead_consultant: 'Consultor Demo',
            phase: 'Diagnóstico',
            status: 'amarillo',
            next_action: 'Revisar Mock Data',
            next_action_date: '2025-12-31',
            notion_url: 'https://notion.so',
            drive_url: 'https://drive.google.com',
            summary: {
                objective: 'Validar UI de Octopus',
                problem: 'Falta de datos reales en modo dev',
                pillars: ['Eficiencia', 'Testing', 'UX'],
                services: ['Auditoría']
            },
            team: {
                consultants: ['Dev 1', 'Dev 2'],
                client_rep: 'Cliente Falso',
                client_email: 'cliente@demo.com',
                client_location: 'https://maps.google.com',
                client_contacts: [
                    { name: 'Contacto 1', role: 'Gerente', email: 'c1@test.com', phone: '123', notes: 'Nota test' }
                ],
                roles: 'Roles simulados'
            },
            milestones: [
                { name: 'Inicio Mock', date: '2025-01-01', status: 'done' },
                { name: 'Prueba UI', date: '2025-01-02', status: 'in_progress' }
            ],
            activity_log: [
                { date: '2025-12-10', text: 'Mock generado automáticamente', author: 'System' }
            ]
        } as Project;
    }

    return null;
};

/**
 * Creates a project. Saves to LocalStorage immediately, then tries Supabase.
 */
export const createProject = async (project: Omit<Project, 'id' | 'created_at'>): Promise<Project | null> => {
    // 1. Prepare object
    const newProject: Project = {
        ...project,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        milestones: project.milestones || [],
        activity_log: project.activity_log || []
    };

    // 2. Save Local
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        const currentList: Project[] = localData ? JSON.parse(localData) : [];
        const newList = [newProject, ...currentList];
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(newList));
        console.log("✅ Project saved locally:", newProject.business_name);
    } catch (e) {
        console.error("Error saving local project", e);
    }

    // 3. Save Supabase (Fire and forget-ish, but check error)
    if (supabase) {
        try {
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 10000);
            });

            const insertPromise = supabase.from('projects').insert([newProject]);

            const result = await Promise.race([insertPromise, timeoutPromise]);

            if ('timeout' in result) {
                console.error("❌ Supabase INSERT timed out. Saved locally only.");
            } else {
                const { error } = result as any;
                if (error) {
                    console.warn("⚠️ Supabase Insert Failed (Dev Mode/RLS?):", error.message);
                } else {
                    console.log("✅ Project synced to Supabase");
                }
            }
        } catch (e) {
            console.warn("Supabase insert exception", e);
        }
    }

    return newProject;
};

/**
 * Updates a project. Saves to LocalStorage immediately, then tries Supabase.
 */
export const updateProject = async (project: Project): Promise<Project | null> => {
    // 0. Sanitize / Fill defaults
    const safeProject: Project = {
        ...project,
        team: {
            ...project.team,
            client_contacts: project.team?.client_contacts || []
        }
    };

    // 1. Update Local
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        let currentList: Project[] = localData ? JSON.parse(localData) : [];

        // Replace the item
        const index = currentList.findIndex(p => p.id === project.id);
        if (index !== -1) {
            currentList[index] = project;
        } else {
            // If not found locally (maybe fetched from server originally), add it
            currentList.push(project);
        }

        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(currentList));
        console.log("✅ Project updated locally:", project.business_name);
    } catch (e) {
        console.error("Error updating local project", e);
    }

    // 2. Update Supabase
    if (supabase) {
        try {
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 10000);
            });

            // Use upsert to handle both updates and potential recovery of missing records
            const upsertPromise = supabase
                .from('projects')
                .upsert(project)
                .select();

            const result = await Promise.race([upsertPromise, timeoutPromise]);

            if ('timeout' in result) {
                console.error("❌ Supabase UPDATE timed out. Saved locally only.");
            } else {
                const { error } = result as any;
                if (error) {
                    console.error("⚠️ Supabase Update/Upsert Failed:", error.message);
                    // We don't throw here to allowing continuing offline
                } else {
                    console.log("✅ Project synced to Supabase");
                }
            }
        } catch (e) {
            console.error("Supabase update exception", e);
            // Don't re-throw, let UI continue with local state
        }
    }

    return project;
};

/**
 * Deletes a project by ID. Removes from LocalStorage and Supabase.
 */
export const deleteProject = async (id: string): Promise<void> => {
    // 1. Delete Local
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (localData) {
            let currentList: Project[] = JSON.parse(localData);
            const initialLength = currentList.length;
            currentList = currentList.filter(p => p.id !== id);

            if (currentList.length < initialLength) {
                localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(currentList));
                console.log("✅ Project deleted locally:", id);
            }
        }
    } catch (e) {
        console.error("Error deleting local project", e);
    }

    // 2. Delete Supabase
    if (supabase) {
        try {
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 10000);
            });

            const deletePromise = supabase
                .from('projects')
                .delete()
                .eq('id', id);

            const result = await Promise.race([deletePromise, timeoutPromise]);

            if ('timeout' in result) {
                console.error("❌ Supabase DELETE timed out. Deleted locally only.");
            } else {
                const { error } = result as any;
                if (error) {
                    console.error("⚠️ Supabase Delete Failed:", error.message);
                } else {
                    console.log("✅ Project deleted from Supabase");
                }
            }
        } catch (e) {
            console.error("Supabase delete exception", e);
        }
    }
};

/**
 * Syncs all local projects to Supabase.
 * Useful for recovering data that was "stuck" locally due to RLS or network issues.
 */
export const syncLocalProjects = async (): Promise<void> => {
    if (!supabase) return;

    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (!localData) return;

        const localProjects: Project[] = JSON.parse(localData);
        if (localProjects.length === 0) return;

        console.log(`🔄 Syncing ${localProjects.length} projects to Supabase...`);

        // We use upsert for each project to avoid duplicates if some already exist
        const { error } = await supabase
            .from('projects')
            .upsert(localProjects, { onConflict: 'id' });

        if (error) {
            console.error("❌ Sync Failed (RLS might still be blocking):", error.message);
        } else {
            console.log("✅ All local projects synced successfully!");
        }

    } catch (e) {
        console.error("Sync exception", e);
    }
};
