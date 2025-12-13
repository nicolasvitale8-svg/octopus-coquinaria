
import { Project } from '../types';
import { supabase } from './supabase';
import { runWithRetryAndTimeout } from './network';

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

    const client = supabase;
    if (!client) return localProjects;

    try {
        const response = await runWithRetryAndTimeout(
            () =>
                new Promise((resolve, reject) => {
                    client
                        .from('projects')
                        .select('*')
                        .order('created_at', { ascending: false })
                        .then(resolve, reject);
                }),
            { timeoutMs: 30000, retries: 2, backoffMs: 1600, label: 'Cargar proyectos' }
        );

        const { data, error } = response as any;

        if (error) {
            console.warn("Supabase fetch failed (likely dev mode/RLS), using local only.", error.message);
            return localProjects;
        }

        if (data) {
            const serverIds = new Set(data.map((p: Project) => p.id));
            const uniqueLocal = localProjects.filter(p => !serverIds.has(p.id));
            const combined = [...data, ...uniqueLocal];
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(combined));
            return combined;
        }
    } catch (error) {
        console.error("Supabase fetch exception (retry)", error);
    }

    return localProjects;
};

export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (localData) {
            const projects: Project[] = JSON.parse(localData);
            const localProject = projects.find(p => p.id === id);
            if (localProject) return localProject;
        }
    } catch (e) {
        console.warn("Error reading local project by id", e);
    }

    const client = supabase;
    if (client) {
        try {
            const response = await runWithRetryAndTimeout(
                () =>
                    new Promise((resolve, reject) => {
                        client
                            .from('projects')
                            .select('*')
                            .eq('id', id)
                            .single()
                            .then(resolve, reject);
                    }),
                { timeoutMs: 5000, retries: 2, backoffMs: 1200, label: `Proyecto ${id}` }
            );

            const { data, error } = response as any;

            if (data) return data;
            if (error) console.warn("Supabase fetch project by id error:", error.message);
        } catch (error) {
            console.warn("Supabase fetch project failed (retry).", error);
        }
    }

    if (id === '16326af3-462f-45b7-897e-0d83461ebf46') {
        console.warn("?? Project not found. Generating MOCK PROJECT for Dev/Testing.");
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

        // WRAPPED WITH TIMEOUT for bad networks
        const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
            setTimeout(() => resolve({ timeout: true }), 60000); // 60s max per sync attempt
        });

        const syncPromise = supabase
            .from('projects')
            .upsert(localProjects, { onConflict: 'id' });

        const result = await Promise.race([syncPromise, timeoutPromise]);

        if ('timeout' in result) {
            console.error("❌ Sync Timed Out (Network too slow for bulk upload).");
            throw new Error("Network Timeout during Sync");
        } else {
            const { error } = result as any;
            if (error) {
                console.error("❌ Sync Failed (RLS/Auth):", error.message);
            } else {
                console.log("✅ All local projects synced and confirmed by server!");
            }
        }

    } catch (e) {
        console.error("Sync exception", e);
    }
};
