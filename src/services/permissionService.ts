import { supabase } from './supabase';
import { Permission, UserRole } from '../types';

/**
 * permissionService.ts 🐙
 * Manages atomic permissions for users globally and within specific projects.
 */

export const permissionService = {
    /**
     * Checks if the current user has a specific permission globally or in a project.
     */
    can: async (permission: Permission, projectId?: string): Promise<boolean> => {
        if (!supabase) return false;

        try {
            // Use the RPC function defined in schema_v4.sql for consistent server-side logic
            const { data, error } = await supabase.rpc('can_do', {
                action_perm: permission,
                pid: projectId || null
            });

            if (error) {
                console.error("Error checking permission:", error);
                return false;
            }

            return !!data;
        } catch (e) {
            console.error("Permission check exception:", e);
            return false;
        }
    },

    /**
     * Synchronous check for UI purposes (using profile from context)
     */
    canSync: (profile: any, permission: Permission, projectId?: string): boolean => {
        if (!profile) return false;

        // 1. Admin always has access
        if (profile.role === 'admin' || profile.permissions?.includes('super_admin')) return true;

        // 2. Initial global permission check
        if (profile.permissions?.includes(permission)) return true;

        // 3. Project-specific check (requires searching in project_members if available in state)
        // This part usually requires the project data to be loaded in the component

        return false;
    }
};
