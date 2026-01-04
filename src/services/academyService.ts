import { supabase } from './supabase';
import { AcademyResource, LearningPath, ResourceCategory, ResourceFormat, ResourceImpactTag, ResourceAccess } from '../types';

const ACADEMY_STORAGE_KEY = 'octopus_academy_v2_cache';
const PATHS_STORAGE_KEY = 'octopus_learning_paths_cache';

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

        return (data || []).map((r: any) => ({
            id: r.id,
            title: r.titulo,
            description: r.descripcion || '',
            outcome: r.outcome || '',
            category: (r.category || 'OPERACIONES') as ResourceCategory,
            format: (r.format || 'GUIDE') as ResourceFormat,
            impactTag: (r.impact_tag || 'HERRAMIENTA') as ResourceImpactTag,
            level: r.level || 1,
            durationMinutes: r.duration_minutes || 5,
            access: (r.access || 'PUBLIC') as ResourceAccess,
            isPinned: r.is_pinned || false,
            pinnedOrder: r.pinned_order,
            expiresAt: r.expires_at,
            createdAt: r.created_at,
            downloadUrl: r.url, // Legacy map
            youtubeId: r.youtube_id,
            pilares: r.pilares || []
        }));
    } catch (e) {
        console.error("Error fetching resources:", e);
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
        console.error("Error fetching paths:", e);
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
            (userPlan === 'PRO' || r.access === 'PUBLIC')
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
export const createResource = async (r: any) => {
    if (!supabase) return;

    // Mapping payload to DB columns (snake_case)
    const dbPayload: any = {
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
        youtube_id: r.youtube_id,
        action_steps: r.actionSteps || [],
        pilares: r.pilares || [],
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
        console.error("Supabase direct error:", error);
        throw error;
    }
    return data;
};

export const syncLocalResources = async () => { };
