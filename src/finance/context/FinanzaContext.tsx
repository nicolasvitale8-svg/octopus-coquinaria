
import React, { createContext, useContext, useState, useEffect } from 'react';
import { IFinanceService } from '../services/IFinanceService';
import { SupabaseService } from '../services/supabaseService';
import { DemoFinanceService } from '../services/demoFinanceService';
import { useAuth } from '../../contexts/AuthContext';

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
    // Demo Mode Types
    isDemoMode: boolean;
    toggleDemoMode: () => void;
    service: IFinanceService;
}

const FinanzaContext = createContext<FinanzaContextProps | undefined>(undefined);

export const FinanzaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [activeEntity, setActiveEntityState] = useState<FinanceEntity>({ id: null, name: 'Mis Finanzas', type: 'personal' });
    const [availableEntities, setAvailableEntities] = useState<FinanceEntity[]>([]);
    const [alertCount, setAlertCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Demo Mode State
    const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
    const [demoService] = useState(() => new DemoFinanceService());

    const toggleDemoMode = () => {
        setIsDemoMode(prev => !prev);
    };

    const service = isDemoMode ? demoService : SupabaseService;

    // Hooks
    const { user, profile, isAdmin } = useAuth();

    // Initial load of entities
    useEffect(() => {
        const loadEntities = async () => {
            if (!user) return; // Wait for AuthContext
            setIsLoading(true);

            try {
                // Import dinámico seguro o usar el que ya está cacheado
                let sb;
                const sbModule = await import('../../services/supabase');
                sb = sbModule.supabase;

                const personalEntity: FinanceEntity = { id: null, name: 'Mis Finanzas', type: 'personal' };
                const entities: FinanceEntity[] = [personalEntity];

                if (isAdmin) {
                    // Admins see ALL projects WITH finanzaflow enabled
                    const { data: allProjects, error: adminQueryError } = await sb
                        .from('projects')
                        .select('id, business_name, finanzaflow_enabled')
                        .eq('finanzaflow_enabled', true);

                    if (adminQueryError) {
                        console.error("❌ Error query admin entities:", adminQueryError.message);
                    }

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
                    const { data: members, error } = await sb
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

        if (user) {
            loadEntities();
        } else {
            setAvailableEntities([]);
            setIsLoading(false);
        }
    }, [user, isAdmin]); // user y isAdmin son estables del useAuth, esto corta el loop.

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
            isLoading,
            isDemoMode,
            toggleDemoMode,
            service
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
