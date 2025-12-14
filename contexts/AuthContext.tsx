import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

// Tipos de roles soportados
// Tipos de roles soportados
export type UserRole = 'admin' | 'consultant' | 'client' | 'manager' | 'user';

export interface UserPermissions {
    can_view_dashboard: boolean;
    can_view_calendar: boolean;
    can_view_finance: boolean;
    can_edit_calendar: boolean;
    can_manage_users: boolean;
    can_view_ticker: boolean;
}

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    role: UserRole;
    business_name?: string;
    permissions?: string[]; // Array of strings e.g. ['view_dashboard', 'edit_calendar']
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    isConsultant: boolean;
    isPremium: boolean;
    isManager: boolean;
    hasPermission: (permission: string) => boolean;
    signOut: () => Promise<void>;
    devLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    isConsultant: false,
    isPremium: false,
    isManager: false,
    hasPermission: () => false,
    signOut: async () => { },
    devLogin: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string, email?: string, metadata?: any) => {
        try {
            if (!supabase) return;

            // Intentamos buscar el perfil
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            // LISTA DE CORREOS AUTORIZADOS COMO ADMIN (REMOVED - DATABASE AUTHORITY ONLY)
            // const DEV_ADMIN_EMAILS = ['admin@octopus.com', 'nicolasvitale8@gmail.com'];

            if (data) {
                // Respetar rol de BDD 100%
                setProfile(data as UserProfile);
            } else {
                // Si no existe, lo creamos
                console.log("Creando perfil nuevo para", userId);
                const newProfile = {
                    id: userId,
                    email: email,
                    full_name: metadata?.full_name || metadata?.name || email?.split('@')[0],
                    role: 'user' as UserRole // Default role is ALWAYS user
                };

                const { error: insertError } = await supabase
                    .from('usuarios')
                    .insert([newProfile]);

                if (!insertError) {
                    setProfile(newProfile as UserProfile);
                } else {
                    console.error("Error creating profile:", insertError);
                    setProfile(newProfile as UserProfile);
                }
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
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

        const mockProfile: UserProfile = {
            id: 'dev-admin-id',
            email: 'admin@local.dev',
            full_name: 'Desarrollador Local',
            role: 'admin', // ¡Siempre Admin!
            business_name: 'Local Dev Corp'
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setIsLoading(false);
    };

    const isSuperAdminEmail = (email?: string) => {
        return email === 'nicolasvitale8@gmail.com' || email === 'admin@local.dev';
    };

    const value = {
        user,
        profile,
        isLoading,
        isAdmin: profile?.role === 'admin' || isSuperAdminEmail(user?.email),
        isConsultant: profile?.role === 'consultant' || profile?.role === 'admin' || isSuperAdminEmail(user?.email),
        isPremium: profile?.role === 'client' || profile?.role === 'consultant' || profile?.role === 'admin' || isSuperAdminEmail(user?.email),
        isManager: profile?.role === 'manager',
        hasPermission: (permission: string) => {
            if (profile?.role === 'admin' || isSuperAdminEmail(user?.email)) return true;
            return profile?.permissions?.includes(permission) || false;
        },
        signOut,
        devLogin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
