import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

// Tipos de roles soportados
export type UserRole = 'admin' | 'consultant' | 'user';

interface UserProfile {
    id: string;
    email?: string;
    full_name?: string;
    role: UserRole;
    business_name?: string;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    isLoading: boolean;
    isAdmin: boolean;
    isConsultant: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    isLoading: true,
    isAdmin: false,
    isConsultant: false,
    signOut: async () => { },
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

            if (data) {
                setProfile(data as UserProfile);
            } else {
                // Si no existe, lo creamos (Upsert pattern)
                console.log("Creando perfil nuevo para", userId);
                const newProfile = {
                    id: userId,
                    email: email,
                    full_name: metadata?.full_name || metadata?.name || email?.split('@')[0],
                    role: 'user' as UserRole
                };

                const { error: insertError } = await supabase
                    .from('usuarios')
                    .insert([newProfile]);

                if (!insertError) {
                    setProfile(newProfile as UserProfile);
                } else {
                    console.error("Error creating profile:", insertError);
                    // Fallback local visual
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
            if (supabase) {
                await supabase.auth.signOut();
            }
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            // Force clean state
            setUser(null);
            setProfile(null);
            localStorage.clear(); // Clean any persisted state
        }
    };

    const value = {
        user,
        profile,
        isLoading,
        isAdmin: profile?.role === 'admin',
        isConsultant: profile?.role === 'consultant' || profile?.role === 'admin', // Admin incluye permisos de consultor
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
