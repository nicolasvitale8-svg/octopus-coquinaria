
import { Project } from '../types';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { runWithRetryAndTimeout } from './network';
import { logger } from './logger';

// Generic Supabase response type
interface SupabaseResponse<T> {
    data: T[] | null;
    error: { message: string } | null;
}

// Single item response
interface SupabaseSingleResponse<T> {
    data: T | null;
    error: { message: string } | null;
}

// Mutation response (insert/update/delete)
interface SupabaseMutationResponse {
    data: unknown;
    error: { message: string } | null;
}

const PROJECTS_STORAGE_KEY = 'octopus_projects_local';

/**
 * Fetch projects from Supabase first, fallback to LocalStorage.
 * @param filterIds Optional array of business IDs to filter results.
 */
export const getAllProjects = async (filterIds?: string[]): Promise<Project[]> => {
    logger.debug('Fetching projects', { context: 'ProjectService', data: filterIds ? `Filtered: ${filterIds.length}` : 'All' });
    let localProjects: Project[] = [];
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (localData) {
            localProjects = JSON.parse(localData);
        }
    } catch (e) {
        logger.warn('Error reading local projects', { context: 'ProjectService', data: e });
    }

    const client = supabase;
    if (!client) return localProjects;

    try {
        const response = await runWithRetryAndTimeout(
            () =>
                new Promise((resolve, reject) => {
                    let query = client
                        .from('projects')
                        .select(`
                            *,
                            tasks:tasks(status, priority),
                            deliverables:deliverables(status)
                        `)
                        .order('created_at', { ascending: false });

                    // Apply filter if provided
                    if (filterIds && filterIds.length > 0) {
                        query = query.in('id', filterIds);
                    }

                    query.then(resolve, reject);
                }),
            { timeoutMs: 15000, retries: 1, backoffMs: 1000, label: 'Cargar proyectos' }
        );

        const { data, error } = response as SupabaseResponse<Project>;

        if (error) {
            logger.warn('Supabase fetch failed, using local only', { context: 'ProjectService', data: error.message });
            return localProjects;
        }

        if (data) {
            const serverIds = new Set(data.map((p: Project) => p.id));
            const uniqueLocal = localProjects.filter(p => !serverIds.has(p.id));
            const combined = [...data, ...uniqueLocal];

            // Only sync local cache if we are fetching EVERYTHING (Admin)
            // to avoid overwriting local full cache with a partial fetch for a client.
            if (!filterIds || filterIds.length === 0) {
                localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(combined));
            }

            return combined;
        }
    } catch (error) {
        logger.error('Supabase fetch exception', { context: 'ProjectService', data: error });
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
        logger.warn('Error reading local project by id', { context: 'ProjectService', data: e });
    }

    const client = supabase;
    if (client) {
        try {
            const response = await runWithRetryAndTimeout(
                () =>
                    new Promise((resolve, reject) => {
                        client
                            .from('projects')
                            .select(`
                                *,
                                project_members (
                                    user_id,
                                    role_id,
                                    specialties,
                                    permissions_override,
                                    usuarios (
                                        id,
                                        full_name,
                                        email,
                                        role,
                                        job_title
                                    ),
                                    roles (
                                        id,
                                        name
                                    )
                                )
                            `)
                            .eq('id', id)
                            .single()
                            .then(resolve, reject);
                    }),
                { timeoutMs: 5000, retries: 2, backoffMs: 1200, label: `Proyecto ${id}` }
            );

            const { data, error } = response as SupabaseSingleResponse<Project>;

            if (data) return data;
            if (error) logger.warn('Supabase fetch project by id error', { context: 'ProjectService', data: error.message });
        } catch (error) {
            logger.warn('Supabase fetch project failed', { context: 'ProjectService', data: error });
        }
    }

    if (id === '16326af3-462f-45b7-897e-0d83461ebf46') {
        logger.warn('Project not found - generating MOCK for dev', { context: 'ProjectService' });
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
        logger.success('Project saved locally', { context: 'ProjectService', data: newProject.business_name });
    } catch (e) {
        logger.error('Error saving local project', { context: 'ProjectService', data: e });
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
                logger.error('Supabase INSERT timed out', { context: 'ProjectService' });
            } else {
                const { error } = result as SupabaseMutationResponse;
                if (error) {
                    logger.warn('Supabase Insert Failed', { context: 'ProjectService', data: error.message });
                } else {
                    logger.success('Project synced to Supabase', { context: 'ProjectService' });
                }
            }
        } catch (e) {
            logger.warn('Supabase insert exception', { context: 'ProjectService', data: e });
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
        logger.success('Project updated locally', { context: 'ProjectService', data: project.business_name });
    } catch (e) {
        logger.error('Error updating local project', { context: 'ProjectService', data: e });
    }

    // 2. Update Supabase
    if (supabase) {
        try {
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 10000);
            });

            // SANITIZE: Remove virtual/joined fields that don't exist in the 'projects' table
            const { tasks, deliverables, project_members, business_memberships, ...cleanProject } = safeProject as any;

            logger.debug('Sanitized project for upsert', { context: 'ProjectService', data: Object.keys(cleanProject) });

            // Use upsert to handle both updates and potential recovery of missing records
            const upsertPromise = supabase
                .from('projects')
                .upsert(cleanProject)
                .select();

            const result = await Promise.race([upsertPromise, timeoutPromise]);

            if ('timeout' in result) {
                logger.error('Supabase UPDATE timed out', { context: 'ProjectService' });
            } else {
                const { error, data } = result as SupabaseResponse<Project>;
                if (error) {
                    logger.error('Supabase Update/Upsert Failed', { context: 'ProjectService', data: error.message });
                    return null;
                } else {
                    logger.success('Project synced to Supabase', { context: 'ProjectService', data: data?.[0]?.business_name });
                }
            }
        } catch (e) {
            logger.error('Supabase update exception', { context: 'ProjectService', data: e });
            return null;
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
                logger.success('Project deleted locally', { context: 'ProjectService', data: id });
            }
        }
    } catch (e) {
        logger.error('Error deleting local project', { context: 'ProjectService', data: e });
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
                logger.error('Supabase DELETE timed out', { context: 'ProjectService' });
            } else {
                const { error } = result as SupabaseMutationResponse;
                if (error) {
                    logger.error('Supabase Delete Failed', { context: 'ProjectService', data: error.message });
                } else {
                    logger.success('Project deleted from Supabase', { context: 'ProjectService' });
                }
            }
        } catch (e) {
            logger.error('Supabase delete exception', { context: 'ProjectService', data: e });
        }
    }
};

/**
 * Syncs all local projects to Supabase.
 * Useful for recovering data that was "stuck" locally due to RLS or network issues.
 */
export const syncLocalProjects = async (): Promise<void> => {
    try {
        const localData = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (!localData) return;

        const localProjects: Project[] = JSON.parse(localData);
        if (localProjects.length === 0) return;

        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        logger.info(`Syncing ${localProjects.length} projects via RAW FETCH`, { context: 'ProjectService' });

        let successCount = 0;
        let failCount = 0;

        for (const project of localProjects) {
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
                    method: 'POST',
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify(project)
                });

                if (!response.ok) {
                    const text = await response.text();
                    logger.error('Fetch Failed', { context: 'ProjectService', data: { name: project.business_name, status: response.status, text } });
                    failCount++;
                } else {
                    logger.success('Raw Sync Success', { context: 'ProjectService', data: project.business_name });
                    successCount++;
                }
            } catch (innerError) {
                logger.error('Network Exception', { context: 'ProjectService', data: { name: project.business_name, error: innerError } });
                failCount++;
            }
        }

        if (failCount > 0) {
            throw new Error(`Sync completed with errors: ${successCount} success, ${failCount} failed.`);
        } else {
            logger.success('All local projects synced successfully via REST', { context: 'ProjectService' });
            alert("✅ Sincronización completada (Método REST).");
            window.location.reload();
        }

    } catch (e) {
        logger.error('Sync exception', { context: 'ProjectService', data: e });
        alert("Error en sincronización: " + (e as Error).message);
    }
};
