import { supabase } from './supabase';
import { logger } from './logger';
import { AcademyResource, LearningPath, ResourceCategory, ResourceFormat, ResourceImpactTag, ResourceAccess } from '../types';

const ACADEMY_STORAGE_KEY = 'octopus_academy_v2_cache';
const PATHS_STORAGE_KEY = 'octopus_learning_paths_cache';

// Database row type for recursos_academia
interface DBResourceRow {
    id: string;
    titulo: string;
    descripcion?: string;
    outcome?: string;
    category?: string;
    format?: string;
    impact_tag?: string;
    level?: number;
    duration_minutes?: number;
    access?: string;
    is_pinned?: boolean;
    pinned_order?: number;
    expires_at?: string;
    created_at?: string;
    url?: string;
    url_2?: string;
    url_3?: string;
    youtube_id?: string;
    action_steps?: string[];
    pilares?: string[];
    impact_outcome?: string;
    impact_format?: string;
    impact_program?: string;
}

// Input type for creating/updating resources
export interface ResourceInput {
    id?: string;
    titulo?: string;
    title?: string;
    description?: string;
    outcome?: string;
    category?: ResourceCategory;
    format?: ResourceFormat;
    impactTag?: ResourceImpactTag;
    level?: number;
    durationMinutes?: number;
    access?: ResourceAccess;
    isPinned?: boolean;
    url?: string;
    url2?: string;
    url3?: string;
    youtube_id?: string;
    actionSteps?: string[];
    pilares?: string[];
    impactOutcome?: string;
    impactFormat?: string;
    impactProgram?: string;
}

/**
 * Fetch all resources
 */
export const getResources = async (): Promise<AcademyResource[]> => {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('recursos_academia')
            .select('*')
            .order('pinned_order', { ascending: true });

        if (error) throw error;

        return (data || []).map((r: DBResourceRow) => ({
            id: r.id,
            title: r.titulo,
            description: r.descripcion || '',
            outcome: r.outcome || '',
            category: (r.category || 'OPERACIONES') as ResourceCategory,
            format: (r.format || 'GUIDE') as ResourceFormat,
            impactTag: (r.impact_tag || 'HERRAMIENTA') as ResourceImpactTag,
            level: (r.level || 1) as 1 | 2 | 3,
            durationMinutes: r.duration_minutes || 5,
            access: (r.access || 'PUBLIC') as ResourceAccess,
            isPinned: r.is_pinned || false,
            pinnedOrder: r.pinned_order,
            expiresAt: r.expires_at,
            createdAt: r.created_at || '',
            downloadUrl: r.url,
            url2: r.url_2,
            url3: r.url_3,
            youtubeId: r.youtube_id,
            actionSteps: r.action_steps || [],
            pilares: r.pilares || [],
            impactOutcome: r.impact_outcome,
            impactFormat: r.impact_format,
            impactProgram: r.impact_program
        }));
    } catch (e) {
        logger.error('Error fetching resources', { context: 'AcademyService', data: e });
        return [];
    }
};

/**
 * Fetch all learning paths
 */
export const getLearningPaths = async (): Promise<LearningPath[]> => {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('rutas_aprendizaje')
            .select('*')
            .eq('is_published', true)
            .order('order', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (e) {
        logger.error('Error fetching paths', { context: 'AcademyService', data: e });
        return [];
    }
};

/**
 * ALGORITMO CENTRAL: Recomendación por diagnóstico
 */
export const getRecommendedContent = (
    resources: AcademyResource[],
    paths: LearningPath[],
    scores: Record<string, number> = {},
    userPlan: 'FREE' | 'PRO' = 'FREE'
) => {
    // 1. Identificar prioridades reales (menor score primero)
    // Las keys de scores en AuthContext son minúsculas (costos, operaciones, etc)
    // Las ResourceCategory son MAYÚSCULAS.
    const categories: ResourceCategory[] = ['COSTOS', 'OPERACIONES', 'EQUIPO', 'MARKETING', 'TECNOLOGIA', 'CLIENTE'];

    const sortedCategories = [...categories].sort((a, b) => {
        const scoreA = scores[a.toLowerCase()] ?? 100;
        const scoreB = scores[b.toLowerCase()] ?? 100;
        return scoreA - scoreB;
    });

    const topCategory = sortedCategories[0];
    const hasScores = Object.keys(scores).length > 0;

    // 2. Filtrar Rutas Recomendadas (Solo para PRO)
    // Si es FREE, no ve recomendaciones personalizadas de rutas completas (Visión 1.1)
    let recommendedPaths: LearningPath[] = [];
    if (userPlan === 'PRO' && hasScores) {
        recommendedPaths = paths.filter(p => p.category === topCategory).slice(0, 1);
    }

    // 3. Filtrar Recursos Recomendados (Máximo 3)
    // Level 1 y priorizando QUICK_WIN (Visión 3)
    let recommendedResources: AcademyResource[] = resources
        .filter(r =>
            r.category === topCategory &&
            r.level === 1 &&
            (userPlan === 'PRO' || r.access === 'PUBLIC' || r.access === 'FREE')
        )
        .sort((a, b) => (a.impactTag === 'QUICK_WIN' ? -1 : 1))
        .slice(0, 3);

    return {
        topCategory,
        recommendedPaths,
        recommendedResources,
        hasScores
    };
};

/** 
 * Delete resource
 */
export const deleteResource = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('recursos_academia').delete().eq('id', id);
    if (error) throw error;
};

/** 
 * Create/Update resource
 */
export const createResource = async (r: ResourceInput) => {
    if (!supabase) return;

    // Mapping payload to DB columns (snake_case)
    const dbPayload: Partial<DBResourceRow> & { tipo?: string; es_premium?: boolean } = {
        titulo: r.titulo || r.title,
        descripcion: r.description,
        outcome: r.outcome,
        category: r.category,
        format: r.format,
        impact_tag: r.impactTag,
        level: r.level,
        duration_minutes: r.durationMinutes,
        access: r.access,
        is_pinned: r.isPinned,
        url: r.url,
        url_2: r.url2,
        url_3: r.url3,
        youtube_id: r.youtube_id,
        action_steps: r.actionSteps || [],
        pilares: r.pilares || [],
        impact_outcome: r.impactOutcome,
        impact_format: r.impactFormat,
        impact_program: r.impactProgram,
        // Legacy check for backward compatibility
        tipo: r.format ? r.format.toLowerCase() : 'video',
        es_premium: r.access === 'PRO'
    };

    // If ID exists and is valid, include it for update
    if (r.id && r.id.length > 5) {
        dbPayload.id = r.id;
    }

    const { data, error } = await supabase
        .from('recursos_academia')
        .upsert([dbPayload])
        .select();

    if (error) {
        logger.error('Supabase direct error', { context: 'AcademyService', data: error });
        throw error;
    }
    return data;
};

export const syncLocalResources = async () => { };
