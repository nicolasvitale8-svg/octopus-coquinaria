
import React, { createContext, useContext, useState, useEffect } from 'react';

type FinanceContextType = 'personal' | 'octopus';

interface FinanzaContextProps {
    context: FinanceContextType;
    setContext: (context: FinanceContextType) => void;
    businessId: string | undefined;
    setBusinessId: (id: string | undefined) => void;
}

const FinanzaContext = createContext<FinanzaContextProps | undefined>(undefined);

export const FinanzaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<FinanceContextType>('personal');
    const [businessId, setBusinessId] = useState<string | undefined>(undefined);

    return (
        <FinanzaContext.Provider value={{ context, setContext, businessId, setBusinessId }}>
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
