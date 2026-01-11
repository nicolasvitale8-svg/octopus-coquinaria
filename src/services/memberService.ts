import { supabase } from './supabase';
import { ProjectMember, AppUser, Role } from '../types';

/**
 * memberService.ts 🐙
 * Handles project memberships, roles, and specialties (V4).
 */

export const memberService = {
    /**
     * Fetch all members for a specific project with their user details
     */
    getProjectMembers: async (projectId: string): Promise<any[]> => {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('project_members')
            .select(`
                *,
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
            `)
            .eq('project_id', projectId);

        if (error) {
            console.error("Error fetching project members:", error);
            return [];
        }

        return data || [];
    },

    /**
     * Add or update a member in a project
     */
    addOrUpdateMember: async (membership: Partial<ProjectMember>): Promise<boolean> => {
        if (!supabase) return false;

        console.log("DEBUG memberService.addOrUpdateMember:", membership);

        const { error } = await supabase
            .from('project_members')
            .upsert(membership, { onConflict: 'project_id, user_id' })
            .select();

        if (error) {
            console.error("Error saving project member:", error.message, error.details, error.hint);
            return false;
        }

        return true;
    },

    /**
     * Remove a member from a project
     */
    removeMember: async (projectId: string, userId: string): Promise<boolean> => {
        if (!supabase) return false;

        console.log("DEBUG memberService.removeMember:", { projectId, userId });

        const { error } = await supabase
            .from('project_members')
            .delete()
            .match({ project_id: projectId, user_id: userId });

        if (error) {
            console.error("Error removing project member:", error.message, error.details, error.hint);
            return false;
        }

        return true;
    },

    /**
     * Fetch all available roles
     */
    getAvailableRoles: async (): Promise<Role[]> => {
        if (!supabase) return [];
        const { data } = await supabase.from('roles').select('*');
        return data || [];
    },

    /**
     * Fetch all available users (to be added as members)
     */
    getAllUsers: async (): Promise<Partial<AppUser>[]> => {
        if (!supabase) return [];
        const { data } = await supabase
            .from('usuarios')
            .select('id, full_name, email, role')
            .order('full_name');
        return data || [];
    },

    /**
     * Fetch all global admins and consultants (Team Octopus)
     */
    getGlobalCollaborators: async (): Promise<Partial<AppUser>[]> => {
        if (!supabase) return [];
        const { data } = await supabase
            .from('usuarios')
            .select('id, full_name, email, role')
            .in('role', ['admin', 'consultant'])
            .order('full_name');
        return data || [];
    }
};
