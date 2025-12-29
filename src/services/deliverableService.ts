import { supabase } from './supabase';
import { Deliverable } from '../types';

/**
 * deliverableService.ts 🐙
 * Manages deliverables, versions, and approval status.
 */

export const deliverableService = {
    /**
     * Fetch all deliverables for a specific project
     */
    getProjectDeliverables: async (projectId: string): Promise<Deliverable[]> => {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('deliverables')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching deliverables:", error);
            return [];
        }

        return data || [];
    },

    /**
     * Create or update a deliverable
     */
    saveDeliverable: async (deliverable: Partial<Deliverable>): Promise<Deliverable | null> => {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('deliverables')
            .upsert(deliverable)
            .select()
            .single();

        if (error) {
            console.error("Error saving deliverable:", error);
            return null;
        }

        return data;
    },

    /**
     * Update deliverable status (Approval flow)
     */
    updateStatus: async (id: string, status: Deliverable['status'], internalNotes?: string): Promise<boolean> => {
        if (!supabase) return false;

        const { error } = await supabase
            .from('deliverables')
            .update({
                status,
                internal_notes: internalNotes,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error("Error updating deliverable status:", error);
            return false;
        }

        return true;
    },

    /**
     * Delete a deliverable
     */
    deleteDeliverable: async (id: string): Promise<boolean> => {
        if (!supabase) return false;

        const { error } = await supabase
            .from('deliverables')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting deliverable:", error);
            return false;
        }

        return true;
    }
};
