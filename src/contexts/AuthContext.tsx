import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

// Tipos de roles soportados
// Tipos de roles soportados
// --- SECURITY TYPES (V3) ---
import { UserRole, Permission, AppUser } from '../types';

// Eliminated old UserPermissions interface in favor of granular strings


// AppUser imported from types.ts represents the Profile


interface AuthContextType {
    user: User | null;
    profile: AppUser | null;
    isLoading: boolean;
    isAdmin: boolean;
    isConsultant: boolean;
    isManager: boolean;
    isClient: boolean;
    isPrivileged: boolean;
    isPremium: boolean;
    hasPermission: (permission: Permission) => boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    isConsultant: false,
    isManager: false,
    isClient: false,
    isPrivileged: false,
    isPremium: false,
    hasPermission: () => false,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string, email?: string, metadata?: any, retryCount = 0) => {
        try {
            if (!supabase) return;

            console.log("🔍 Fetching profile for:", userId, email);

            // Ejecutar ambas consultas en PARALELO para mejor performance
            const [userResult, memberResult] = await Promise.all([
                // 1. Fetch User Profile
                Promise.race([
                    supabase
                        .from('usuarios')
                        .select('id, role, permissions, full_name, business_name, plan, diagnostic_scores')
                        .eq('id', userId)
                        .single(),
                    new Promise<{ timeout: true }>((resolve) =>
                        setTimeout(() => resolve({ timeout: true }), 8000) // 8 segundos
                    )
                ]),
                // 2. Fetch Memberships (en paralelo)
                Promise.race([
                    supabase
                        .from('project_members')
                        .select('project_id')
                        .eq('user_id', userId),
                    new Promise<{ timeout: true }>((resolve) =>
                        setTimeout(() => resolve({ timeout: true }), 5000)
                    )
                ])
            ]);

            // Verificar timeout del perfil
            if ('timeout' in userResult) {
                console.warn("⏱️ Timeout al cargar perfil.");
                // Retry automático (máximo 2 intentos)
                if (retryCount < 2) {
                    console.log("🔄 Reintentando...", retryCount + 1);
                    return fetchProfile(userId, email, metadata, retryCount + 1);
                }
                return;
            }

            const { data: userData, error: userError } = userResult as any;
            const membershipData = 'timeout' in memberResult ? [] : (memberResult as any).data || [];

            if (userData) {
                const userProfile: AppUser = {
                    id: userData.id,
                    email: email || '',
                    name: userData.full_name || email?.split('@')[0] || 'Usuario',
                    role: userData.role as UserRole,
                    plan: (userData.plan || 'FREE') as 'FREE' | 'PRO',
                    diagnostic_scores: userData.diagnostic_scores || {},
                    permissions: (userData.permissions || []) as Permission[],
                    businessIds: membershipData.map((m: any) => m.project_id),
                    businessName: userData.business_name
                };

                setProfile(userProfile);
                console.log("✅ Perfil cargado:", userProfile.role, userProfile.email);
            } else {
                console.warn("⚠️ Perfil no encontrado para el usuario:", userId);
                setProfile(null);
            }
        } catch (err) {
            console.error("❌ Error crítico fetching profile:", err);
            setProfile(null);
        }
    };

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        // 1. Check current session
        const initSession = async () => {
            if (!supabase) return; // TS Check
            try {
                const { data } = await supabase.auth.getSession();
                const session = data.session;

                if (session && session.user) {
                    setUser(session.user);
                    await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error("Error checking session:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initSession();

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session && session.user) {
                setUser(session.user);
                // Si cambió el usuario o no tenemos perfil, buscarlo/crearlo
                if (!profile || profile.id !== session.user.id) {
                    await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            // 1. Attempt network sign out with timeout (don't block UI indefinitely)
            if (supabase) {
                const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
                const signOutPromise = supabase.auth.signOut();
                await Promise.race([signOutPromise, timeoutPromise]);
            }
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            // 2. Force local cleanup
            setUser(null);
            setProfile(null);
            // DO NOT clear all localStorage, we want to keep unsynced projects!
            // localStorage.clear(); 

            // Just clear any potentially stuck Supabase auth keys if needed, 
            // but setUser(null) triggers the App state update regardless.
        }
    };



    // V3 Helper Logic
    const role = profile?.role;
    const isOwner = user?.email?.toLowerCase() === 'nicolasvitale8@gmail.com';

    // Admin/Consultant has implicit full access + OWNER OVERRIDE
    const isPrivileged = role === 'admin' || role === 'consultant' || isOwner;

    const value = {
        user,
        profile,
        isLoading,
        isAdmin: role === 'admin' || isOwner,
        isConsultant: role === 'consultant',
        isManager: role === 'manager',
        isClient: role === 'client' && !isOwner,
        isPrivileged: isPrivileged,
        isPremium: isPrivileged || profile?.plan === 'PRO', // Privileged roles or PRO plan are premium
        hasPermission: (permission: Permission) => {
            // 1. Privileged users (Admin/Consultant) bypass checks
            if (isPrivileged) return true;
            // 2. Granular check
            return profile?.permissions?.includes(permission) || false;
        },
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
