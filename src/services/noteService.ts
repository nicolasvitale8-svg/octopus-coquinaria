import { supabase } from './supabase';
import { ProjectNote } from '../types';

/**
 * noteService.ts 🐙
 * Manages project journal entries (Bitácora).
 */

export const noteService = {
    /**
     * Fetch all notes for a specific project
     */
    getProjectNotes: async (projectId: string): Promise<ProjectNote[]> => {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('project_notes')
            .select(`
                *,
                usuarios (
                    full_name,
                    role
                )
            `)
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching project notes:", error);
            return [];
        }

        return data || [];
    },

    /**
     * Create a new note
     */
    addNote: async (note: Partial<ProjectNote>): Promise<ProjectNote | null> => {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('project_notes')
            .insert([{
                ...note,
                user_id: (await supabase.auth.getUser()).data.user?.id
            }])
            .select(`
                *,
                usuarios (
                    full_name,
                    role
                )
            `)
            .single();

        if (error) {
            console.error("Error adding project note:", error);
            return null;
        }

        return data;
    },

    /**
     * Delete a note
     */
    deleteNote: async (id: string): Promise<boolean> => {
        if (!supabase) return false;

        const { error } = await supabase
            .from('project_notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting project note:", error);
            return false;
        }

        return true;
    }
};
