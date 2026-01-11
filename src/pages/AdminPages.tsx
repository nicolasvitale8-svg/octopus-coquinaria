import React from 'react';






export const AdminConfig = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-800 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-white mb-2">Configuración del Sistema</h2>
            <p className="text-slate-400 mb-8">Ajustes globales de la aplicación.</p>

            <div className="w-full max-w-xs p-6 bg-[#021019] rounded-xl border border-slate-700 shadow-xl">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Versión del Sistema</p>
                <p className="text-3xl font-black text-[#1FB6D5] mt-2 font-space">v4.2.0</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Motor Octopus Activo</span>
                </div>
            </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-[#1FB6D5] text-[#021019] text-xs font-bold px-2 py-0.5 rounded">NEW</span>
                Novedades de la Versión (Fin de Semana)
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">

                <div className="space-y-2">
                    <h4 className="text-[#1FB6D5] font-bold text-sm uppercase">📅 Calendario Comercial v2.2</h4>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 ml-2">
                        <li><strong>Sincronización Total:</strong> Corrección de eventos locales y sync automático con Supabase.</li>
                        <li><strong>UI Pública Simplificada:</strong> Diseño limpio (Día + Título) con modal de detalle.</li>
                        <li><strong>Auto-Scroll:</strong> Enfoque automático en el día actual o próximo evento.</li>
                        <li><strong>Gestión Admin:</strong> Edición directa de eventos sin necesidad de borrar y recrear.</li>
                    </ul>
                </div>

                <div className="border-t border-slate-800 my-2"></div>

                <div className="space-y-2">
                    <h4 className="text-emerald-400 font-bold text-sm uppercase">💰 Finanzas & Dashboard</h4>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 ml-2">
                        <li><strong>Presupuestos:</strong> Corrección en carga y visualización de Enero/Noviembre.</li>
                        <li><strong>UI Mejorada:</strong> Tablas con encabezados fijos (sticky) para mejor navegación.</li>
                        <li><strong>Acceso Clientes:</strong> Unificación del Hub (ven todas las pestañas relevantes).</li>
                        <li><strong>Novedades:</strong> Tarjetas interactivas en el Dashboard principal.</li>
                    </ul>
                </div>

                <div className="border-t border-slate-800 my-2"></div>

                <div className="space-y-2">
                    <h4 className="text-purple-400 font-bold text-sm uppercase">🎓 Academia & Sistema</h4>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 ml-2">
                        <li><strong>Recursos:</strong> Soporte para múltiples URLs y sección de Impacto.</li>
                        <li><strong>Infraestructura:</strong> Restauración de conexión Supabase y fix de permisos RLS.</li>
                    </ul>
                </div>

            </div>
        </div>
    </div>
);
