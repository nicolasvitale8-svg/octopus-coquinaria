import React from 'react';





export const AdminConfig = () => (
    <div className="flex flex-col items-center justify-center h-96 bg-slate-900 rounded-xl border border-slate-800">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Configuración del Sistema</h2>
            <p className="text-slate-400">Ajustes globales de la aplicación.</p>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 w-full max-w-xs text-center">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Versión del Sistema</p>
            <p className="text-xl font-black text-[#1FB6D5] mt-1">v4.1.7</p>
            <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Motor Octopus Activo</span>
            </div>
        </div>
    </div>
);
