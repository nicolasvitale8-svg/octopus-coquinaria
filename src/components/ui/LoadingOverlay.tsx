
import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
    text?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, text = 'Procesando...' }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center animate-fade-in">
            {/* Logo o Icono animado */}
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>

            {/* Texto */}
            <h3 className="text-xl font-bold text-white tracking-widest uppercase animate-pulse">
                {text}
            </h3>

            {/* Barra de progreso decorativa */}
            <div className="w-64 h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-cyan-500 animate-progress origin-left"></div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
