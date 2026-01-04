import { supabase } from './supabase';
import { ProjectTask, TaskType, TaskStatus, TaskPriority, TaskVisibility } from '../types';

/**
 * taskService.ts 🐙
 * Handles CRUD and business logic for project tasks.
 */

export const taskService = {
    /**
     * Fetch all tasks for a project
     */
    getTasksByProject: async (projectId: string): Promise<ProjectTask[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }
        return data as ProjectTask[];
    },

    /**
     * Create a new task
     */
    createTask: async (task: Partial<ProjectTask>): Promise<ProjectTask | null> => {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('tasks')
            .insert([task])
            .select()
            .single();

        if (error) {
            console.error("Error creating task:", error);
            return null;
        }
        return data as ProjectTask;
    },

    /**
     * Update task status (key for transitions)
     */
    updateStatus: async (taskId: string, status: TaskStatus): Promise<boolean> => {
        if (!supabase) return false;
        const { error } = await supabase
            .from('tasks')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', taskId);

        if (error) {
            console.error("Error updating task status:", error);
            return false;
        }
        return true;
    },

    /**
     * Assign task to a user
     */
    assignTask: async (taskId: string, userId: string): Promise<boolean> => {
        if (!supabase) return false;
        const { error } = await supabase
            .from('tasks')
            .update({ assigned_to: userId, updated_at: new Date().toISOString() })
            .eq('id', taskId);

        return !error;
    },

    /**
     * Delete a task
     */
    deleteTask: async (id: string): Promise<boolean> => {
        if (!supabase) return false;
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting task:", error);
            return false;
        }
        return true;
    }
};
