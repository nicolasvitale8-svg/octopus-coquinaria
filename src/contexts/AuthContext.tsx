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
    devLogin: () => Promise<void>;
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
    devLogin: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string, email?: string, metadata?: any) => {
        try {
            if (!supabase) return;

            console.log("🔍 Fetching profile for:", userId, email);

            // 1. Fetch User (Profile + Permissions) con timeout
            const userPromise = supabase
                .from('usuarios')
                .select('id, role, permissions, full_name, business_name')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
                setTimeout(() => resolve({ timeout: true }), 3000)
            );

            const userResult = await Promise.race([userPromise, timeoutPromise]);

            if ('timeout' in userResult) {
                console.error("⏱️ Timeout al cargar perfil. Usando modo offline.");
                // Modo de emergencia: usar email del owner
                const isOwner = email?.toLowerCase() === 'nicolasvitale8@gmail.com';
                setProfile({
                    id: userId,
                    email: email || '',
                    name: email?.split('@')[0] || 'Usuario',
                    role: isOwner ? 'admin' : 'client',
                    permissions: isOwner ? ['super_admin'] : [],
                    businessIds: []
                } as AppUser);
                return;
            }

            const { data: userData, error: userError } = userResult as any;

            // 2. Fetch Memberships (Business IDs) - también con timeout
            const membershipPromise = supabase
                .from('business_memberships')
                .select('business_id')
                .eq('user_id', userId);

            const memberResult = await Promise.race([membershipPromise, new Promise<{ timeout: true }>((resolve) =>
                setTimeout(() => resolve({ timeout: true }), 2000)
            )]);

            const membershipData = 'timeout' in memberResult ? [] : (memberResult as any).data;

            if (userData) {
                // SUCESSO V3: Construir AppUser real
                const userProfile: AppUser = {
                    id: userData.id,
                    email: email || '',
                    name: userData.full_name || email?.split('@')[0] || 'Usuario',
                    role: userData.role as UserRole,
                    permissions: (userData.permissions || []) as Permission[],
                    businessIds: (membershipData || []).map((m: any) => m.business_id),
                    businessName: userData.business_name
                };

                setProfile(userProfile);
                console.log("✅ Perfil cargado:", userProfile.role, userProfile.email);
            } else {
                console.warn("⚠️ Perfil no encontrado. Usando fallback con email:", email);
                const isOwner = email?.toLowerCase() === 'nicolasvitale8@gmail.com';
                setProfile({
                    id: userId,
                    email: email || '',
                    name: email?.split('@')[0] || 'Usuario',
                    role: isOwner ? 'admin' : 'client',
                    permissions: isOwner ? ['super_admin'] : [],
                    businessIds: []
                } as AppUser);
            }
        } catch (err) {
            console.error("❌ Error crítico fetching profile:", err);
            // Emergencia: setear algo para no dejar la UI bloqueada
            const isOwner = email?.toLowerCase() === 'nicolasvitale8@gmail.com';
            setProfile({
                id: userId,
                email: email || '',
                name: email?.split('@')[0] || 'Usuario',
                role: isOwner ? 'admin' : 'client',
                permissions: isOwner ? ['super_admin'] : [],
                businessIds: []
            } as AppUser);
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

    // MOCK LOGIN PARA DESARROLLO LOCAL
    const devLogin = async () => {
        console.warn("⚠️ USANDO LOGIN DE DESARROLLO (BYPASS SUPABASE) ⚠️");
        const mockUser = {
            id: 'dev-admin-id',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@local.dev',
            confirmed_at: new Date().toISOString(),
            app_metadata: { provider: 'email' },
            user_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } as User;

        const mockProfile: AppUser = {
            id: 'dev-admin-id',
            email: 'admin@local.dev',
            name: 'Desarrollador Local',
            role: 'admin', // ¡Siempre Admin!
            businessName: 'Local Dev Corp',
            permissions: ['super_admin'],
            businessIds: []
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setIsLoading(false);
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
        isPremium: isPrivileged || role === 'manager', // Privileged roles or manager are premium
        hasPermission: (permission: Permission) => {
            // 1. Privileged users (Admin/Consultant) bypass checks
            if (isPrivileged) return true;
            // 2. Granular check
            return profile?.permissions?.includes(permission) || false;
        },
        signOut,
        devLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
