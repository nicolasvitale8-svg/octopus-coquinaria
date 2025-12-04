
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllLeads } from '../services/storage';
import { WHATSAPP_NUMBER } from '../constants';
import { MessageCircle, Search, Download, User, Calendar, FileText, X, PieChart as PieIcon, Activity } from 'lucide-react';
import Button from '../components/ui/Button';
import { DiagnosticStatus } from '../types';
import { formatPercent, formatCurrency } from '../services/calculations';

const AdminLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  useEffect(() => {
    // Fetch leads async
    const fetchLeads = async () => {
      setIsLoading(true);
      const loadedLeads = await getAllLeads();
      setLeads(loadedLeads);
      setIsLoading(false);
    };
    
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => 
    lead.leadData?.business?.toLowerCase().includes(filter.toLowerCase()) ||
    lead.leadData?.name?.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: DiagnosticStatus) => {
    switch (status) {
      case DiagnosticStatus.RED: return <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded-full text-xs font-bold border border-red-900/50">Crítico</span>;
      case DiagnosticStatus.YELLOW: return <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded-full text-xs font-bold border border-yellow-900/50">Riesgo</span>;
      case DiagnosticStatus.GREEN: return <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-full text-xs font-bold border border-green-900/50">Estable</span>;
      default: return null;
    }
  };

  const generateWhatsappLink = (lead: any) => {
    const phone = lead.leadData?.phone?.replace(/\D/g, '') || '';
    const target = phone.length > 8 ? phone : WHATSAPP_NUMBER;
    const name = lead.leadData?.name?.split(' ')[0] || 'Hola';
    
    const text = `Hola ${name}, vi tu diagnóstico de Octopus. Veo que tu perfil dio "${lead.profileName}" y me gustaría darte una mano con esos números. ¿Tenés un minuto?`;
    
    return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  };

  return (
    <Layout>
      <div className="bg-slate-950 min-h-screen py-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Base de Datos de Clientes</h1>
              <p className="text-slate-400">Prospectos capturados desde el Autodiagnóstico.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => alert("Descargando Excel...")}>
                <Download className="w-4 h-4 mr-2" /> Exportar CSV
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Leads</p>
              <p className="text-3xl font-bold text-white mt-2">{leads.length}</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tasa Críticos</p>
              <p className="text-3xl font-bold text-red-400 mt-2">
                {leads.length > 0 ? Math.round((leads.filter(l => l.status === DiagnosticStatus.RED).length / leads.length) * 100) : 0}%
              </p>
            </div>
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Oportunidades Hoy</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">
                 {leads.filter(l => new Date(l.date).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            {/* Search Bar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center">
               <Search className="w-5 h-5 text-slate-500 mr-3" />
               <input 
                 type="text" 
                 placeholder="Buscar por negocio o nombre..." 
                 className="bg-transparent border-none focus:ring-0 text-white w-full placeholder-slate-600"
                 value={filter}
                 onChange={(e) => setFilter(e.target.value)}
               />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-950/50 text-slate-400 uppercase tracking-wider font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Negocio / Contacto</th>
                    <th className="px-6 py-4">Perfil Diagnóstico</th>
                    <th className="px-6 py-4">Métricas Clave</th>
                    <th className="px-6 py-4">Estado</th>
                    <th className="px-6 py-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Cargando base de datos...</td>
                    </tr>
                  ) : filteredLeads.length > 0 ? filteredLeads.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-600" />
                          {new Date(lead.date).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                           <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-cyan-500 mr-3 font-bold border border-slate-700">
                             {lead.leadData?.business?.charAt(0) || 'N'}
                           </div>
                           <div>
                             <div className="font-bold text-white text-base">{lead.leadData?.business || 'Sin nombre'}</div>
                             <div className="text-slate-500 text-xs flex items-center mt-0.5">
                               <User className="w-3 h-3 mr-1" /> {lead.leadData?.name}
                             </div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-medium">{lead.profileName}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{lead.profileDescription}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className={lead.cogsPercentage > 35 ? 'text-red-400' : 'text-green-400'}>
                            CMV: {lead.cogsPercentage.toFixed(1)}%
                          </span>
                          <span className={lead.marginPercentage < 10 ? 'text-red-400' : 'text-green-400'}>
                            Mg: {lead.marginPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(lead.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 rounded-full" 
                            title="Ver detalle"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <FileText className="w-4 h-4 text-slate-400 hover:text-white" />
                          </Button>
                          <a href={generateWhatsappLink(lead)} target="_blank" rel="noreferrer">
                            <Button className="bg-green-600 hover:bg-green-500 h-8 px-3 text-xs">
                              <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        {leads.length === 0 
                          ? "Aún no hay diagnósticos registrados. Completá uno para probar." 
                          : "No se encontraron resultados con ese filtro."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-500 text-center">
              Mostrando {filteredLeads.length} de {leads.length} registros
            </div>
          </div>
        </div>

        {/* DETAIL MODAL */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLead(null)}></div>
            <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
              <button 
                onClick={() => setSelectedLead(null)}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8">
                 {/* Header Modal */}
                 <div className="flex items-start gap-4 mb-8 border-b border-slate-800 pb-6">
                    <div className="w-16 h-16 bg-[#00344F] rounded-xl flex items-center justify-center text-3xl font-bold text-[#1FB6D5] border border-[#1FB6D5]/30">
                       {selectedLead.leadData?.business?.charAt(0) || 'N'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white font-space">{selectedLead.leadData?.business}</h2>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-400 mt-1">
                         <span className="flex items-center"><User className="w-3 h-3 mr-1"/> {selectedLead.leadData?.name}</span>
                         <span className="flex items-center"><MessageCircle className="w-3 h-3 mr-1"/> {selectedLead.leadData?.phone}</span>
                         <span className="flex items-center text-[#1FB6D5]">{selectedLead.leadData?.email}</span>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Col: Diagnostic Results */}
                    <div className="space-y-6">
                       <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center">
                             <Activity className="w-4 h-4 mr-2" /> Perfil Operativo
                          </h3>
                          <p className="text-xl font-bold text-white mb-1">{selectedLead.profileName}</p>
                          <p className="text-sm text-slate-400 italic">"{selectedLead.profileDescription}"</p>
                       </div>

                       <div>
                          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Métricas Financieras</h3>
                          <div className="grid grid-cols-3 gap-3 text-center">
                             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <span className="block text-xs text-slate-500">CMV</span>
                                <span className={`font-mono font-bold ${selectedLead.cogsPercentage > 35 ? 'text-red-400' : 'text-green-400'}`}>
                                  {formatPercent(selectedLead.cogsPercentage)}
                                </span>
                             </div>
                             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <span className="block text-xs text-slate-500">Labor</span>
                                <span className={`font-mono font-bold ${selectedLead.laborPercentage > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                  {formatPercent(selectedLead.laborPercentage)}
                                </span>
                             </div>
                             <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                                <span className="block text-xs text-slate-500">Margen</span>
                                <span className={`font-mono font-bold ${selectedLead.marginPercentage < 10 ? 'text-red-400' : 'text-green-400'}`}>
                                  {formatPercent(selectedLead.marginPercentage)}
                                </span>
                             </div>
                          </div>
                       </div>

                       <div>
                          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Prioridades Detectadas</h3>
                          <ul className="space-y-2">
                             {selectedLead.priorities?.map((prio: string, i: number) => (
                               <li key={i} className="text-sm text-slate-300 flex items-start bg-slate-800/30 p-2 rounded">
                                  <span className="text-[#D64747] font-bold mr-2">!</span> {prio}
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>

                    {/* Right Col: 7P Methodology */}
                    <div>
                       <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
                          <PieIcon className="w-4 h-4 mr-2" /> Puntuación 7P
                       </h3>
                       
                       <div className="space-y-3">
                          {/* We try to extract methodology scores from full_data if available */}
                          {['Orden', 'Creatividad', 'Tecnología', 'Observación', 'Pragmatismo', 'Universalidad', 'Sutileza'].map((key) => {
                             // This is a rough mapping if the specific scores map isn't directly available in top level, 
                             // checking full_data structure usually found in 'methodologyScores'
                             const mapKey: Record<string, string> = { 'Orden': 'O', 'Creatividad': 'C', 'Tecnología': 'T', 'Observación': 'O_obs', 'Pragmatismo': 'P', 'Universalidad': 'U', 'Sutileza': 'S' };
                             const score = selectedLead.methodologyScores?.[mapKey[key]] || selectedLead.full_data?.methodologyScores?.[mapKey[key]] || 0;
                             
                             return (
                               <div key={key} className="flex items-center text-sm">
                                  <span className="w-24 text-slate-400">{key}</span>
                                  <div className="flex-1 h-2 bg-slate-800 rounded-full mx-3 overflow-hidden">
                                     <div 
                                       className={`h-full rounded-full ${score >= 4 ? 'bg-[#1FB6D5]' : (score >= 3 ? 'bg-yellow-500' : 'bg-red-500')}`} 
                                       style={{ width: `${(score / 5) * 100}%` }}
                                     ></div>
                                  </div>
                                  <span className="font-bold text-white w-6 text-right">{score}/5</span>
                               </div>
                             );
                          })}
                       </div>

                       {/* Raw Concerns */}
                       {selectedLead.full_data?.primaryConcern && (
                          <div className="mt-8">
                             <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Dolores Principales</h3>
                             <div className="flex flex-wrap gap-2">
                                {selectedLead.full_data.primaryConcern.map((c: string, i: number) => (
                                   <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                                      {c}
                                   </span>
                                ))}
                             </div>
                          </div>
                       )}

                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end">
                    <a href={generateWhatsappLink(selectedLead)} target="_blank" rel="noreferrer">
                       <Button className="bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold">
                          Contactar ahora
                       </Button>
                    </a>
                 </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default AdminLeads;
