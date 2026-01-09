
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FinanceEntity {
    id: string | null; // null for personal
    name: string;
    type: 'personal' | 'business';
}

interface FinanzaContextProps {
    activeEntity: FinanceEntity;
    setActiveEntity: (entity: FinanceEntity) => void;
    availableEntities: FinanceEntity[];
    alertCount: number;
    setAlertCount: (n: number) => void;
    isLoading: boolean;
}

const FinanzaContext = createContext<FinanzaContextProps | undefined>(undefined);

export const FinanzaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeEntity, setActiveEntityState] = useState<FinanceEntity>({ id: null, name: 'Mis Finanzas', type: 'personal' });
    const [availableEntities, setAvailableEntities] = useState<FinanceEntity[]>([]);
    const [alertCount, setAlertCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load of entities
    useEffect(() => {
        const loadEntities = async () => {
            setIsLoading(true);
            try {
                const { supabase } = await import('../../services/supabase');
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) return;

                // Check for admin role
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const isAdmin = profile?.role === 'admin';
                const personalEntity: FinanceEntity = { id: null, name: 'Mis Finanzas', type: 'personal' };
                const entities: FinanceEntity[] = [personalEntity];

                if (isAdmin) {
                    // Admins see ALL projects WITH finanzaflow enabled
                    const { data: allProjects } = await supabase
                        .from('projects')
                        .select('id, business_name, finanzaflow_enabled')
                        .eq('finanzaflow_enabled', true);

                    if (allProjects) {
                        allProjects.forEach(p => {
                            entities.push({
                                id: p.id,
                                name: p.business_name,
                                type: 'business'
                            });
                        });
                    }
                } else {
                    // Regular users see ONLY where they are members AND have the module enabled
                    const { data: members, error } = await supabase
                        .from('project_members')
                        .select('project_id, projects(business_name, finanzaflow_enabled)')
                        .eq('user_id', user.id);

                    if (!error && members) {
                        members.forEach((m: any) => {
                            if (m.projects && m.projects.finanzaflow_enabled) {
                                entities.push({
                                    id: m.project_id,
                                    name: m.projects.business_name,
                                    type: 'business'
                                });
                            }
                        });
                    }
                }

                setAvailableEntities(entities);

                // Restore from localStorage if valid
                const saved = localStorage.getItem('finanza_active_entity');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const exists = entities.find(e => e.id === parsed.id);
                    if (exists) setActiveEntityState(exists);
                }
            } catch (err) {
                console.error("Error loading finance entities:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadEntities();
    }, []);

    const setActiveEntity = (entity: FinanceEntity) => {
        setActiveEntityState(entity);
        localStorage.setItem('finanza_active_entity', JSON.stringify(entity));
    };

    return (
        <FinanzaContext.Provider value={{
            activeEntity,
            setActiveEntity,
            availableEntities,
            alertCount,
            setAlertCount,
            isLoading
        }}>
            {children}
        </FinanzaContext.Provider>
    );
};

export const useFinanza = () => {
    const context = useContext(FinanzaContext);
    if (context === undefined) {
        throw new Error('useFinanza must be used within a FinanzaProvider');
    }
    return context;
};
