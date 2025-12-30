
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getAllLeads } from '../services/storage';
import { WHATSAPP_NUMBER } from '../constants';
import { MessageCircle, Search, Download, Users, User, Calendar, FileText, X, PieChart as PieIcon, Activity, Briefcase, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Button from '../components/ui/Button';
import { DiagnosticStatus } from '../types';
import { formatPercent, formatCurrency } from '../services/calculations';

const AdminLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for status filter in navigation state
    if (location.state?.filterStatus) {
      setStatusFilter(location.state.filterStatus);
    }
  }, [location.state]);

  const createProjectFromLead = async (lead: any) => {
    if (!confirm(`¿Crear proyecto para ${lead.leadData?.business}?`)) return;

    if (!supabase) return;

    try {
      // Intentar obtener email del lead si existe en full_data
      const clientEmail = lead.leadData?.email || lead.full_data?.contactEmail;

      const { data, error } = await supabase.from('projects').insert([{
        business_name: lead.leadData?.business || lead.business_name || 'Nuevo Proyecto',
        lead_id: lead.id,
        lead_consultant: 'Sin asignar',
        phase: 'Lead',
        status: 'amarillo',
        summary: {
          problem: lead.full_data?.primaryConcern?.[0] || 'Derivado de diagnóstico',
          objective: 'Estandarización y rentabilidad inicial.'
        },
        team: {
          client_email: clientEmail,
          client_rep: lead.leadData?.name
        }
      }]).select().single();

      if (error) throw error;

      alert("🎉 ¡Proyecto creado con éxito!");
      navigate(`/admin/projects/${data.id}`);
    } catch (e: any) {
      alert(`Error al crear proyecto: ${e.message}`);
    }
  };

  useEffect(() => {
    // Fetch leads async
    // Fetch leads async
    const fetchLeads = async () => {
      // 1. FAST: Load from LocalStorage immediately
      const { getDiagnosticHistory } = await import('../services/storage');
      const history = getDiagnosticHistory();
      const localLeads = history.filter((h: any) => h.type === 'quick' || !h.type);

      if (localLeads.length > 0) {
        setLeads(localLeads);
        setIsLoading(false);
      }

      try {
        // 2. SLOW: Fetch from Supabase in background
        if (localLeads.length === 0) setIsLoading(true);

        const loadedLeads = await getAllLeads();
        setLeads(loadedLeads);
      } catch (e: any) {
        console.error("Error loading leads:", e);
        setError(e.message || "Error desconocido al cargar leads.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter(lead => {
    const searchLower = filter.toLowerCase();
    const business = (lead.leadData?.business || lead.business_name || '').toLowerCase();
    const name = (lead.leadData?.name || lead.contact_name || '').toLowerCase();

    const matchesSearch = !filter || business.includes(searchLower) || name.includes(searchLower);
    const matchesStatus = !statusFilter || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const generateWhatsappLink = (lead: any) => {
    if (!lead) return '#';
    const phone = lead.leadData?.phone?.replace(/\D/g, '') || '';
    const name = lead.leadData?.name?.split(' ')[0] || 'Hola';
    const message = `Hola ${name}, soy parte del equipo de Octopus Coquinaria. Vi tu diagnóstico y me gustaría agendar una breve sesión para revisar tus resultados.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-space flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1FB6D5]" />
            CRM Leads
          </h1>
          <p className="text-slate-400 text-sm">Gestiona los diagnósticos y oportunidades.</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar lead..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-[#1FB6D5] focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {statusFilter && (
        <div className="flex items-center gap-2 bg-red-950/30 border border-red-900/50 p-3 rounded-lg animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-200">
            Mostrando solo leads con estado <span className="font-bold uppercase">{statusFilter}</span>
          </p>
          <button
            onClick={() => setStatusFilter(null)}
            className="ml-auto text-xs font-bold text-red-400 hover:text-white transition-colors"
          >
            QUITAR FILTRO
          </button>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Negocio</th>
                <th className="p-4 font-semibold">Contacto</th>
                <th className="p-4 font-semibold text-center">Score</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Cargando leads...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-red-500">
                    <p className="font-bold">Error cargando leads:</p>
                    <p className="font-mono text-sm">{error}</p>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No se encontraron leads.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(lead.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{lead.leadData?.business || 'Sin Nombre'}</div>
                      <div className="text-xs text-slate-500">{lead.profileName}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{lead.leadData?.name}</div>
                      <div className="text-xs text-slate-500">{lead.leadData?.phone}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-bold font-mono ${getStatusColor(lead.scoreGlobal)}`}>
                        {formatPercent(lead.scoreGlobal)}
                      </div>
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="p-2 bg-slate-700 hover:bg-[#1FB6D5] text-slate-300 hover:text-[#021019] rounded-lg transition-all"
                        title="Ver Detalle"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('¿Estás seguro de que quieres eliminar este Lead? Esta acción no se puede deshacer.')) {
                            // 1. Optimistic UI update - Try matching by ID first, fallback to date
                            setLeads(prev => prev.filter(l =>
                              lead.id ? l.id !== lead.id : l.date !== lead.date
                            ));

                            // 2. Persistent delete
                            const { deleteLead } = await import('../services/storage');
                            await deleteLead(lead);
                          }
                        }}
                        className="p-2 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all"
                        title="Eliminar Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0b1120] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-bold text-white font-space">{selectedLead.leadData?.business}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {selectedLead.leadData?.name}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(selectedLead.date).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 ${getStatusColor(selectedLead.scoreGlobal)} border border-slate-700`}>
                    Score: {Math.round(selectedLead.scoreGlobal)}/100
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Financial KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Costo Mercadería</span>
                  <span className="text-xl font-bold text-white font-mono">{formatPercent(selectedLead.cogsPercentage)}</span>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Costo Laboral</span>
                  <span className="text-xl font-bold text-white font-mono">{formatPercent(selectedLead.laborPercentage)}</span>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                  <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">Margen Bruto</span>
                  <span className={`text-xl font-bold font-mono ${selectedLead.marginPercentage < 15 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatPercent(selectedLead.marginPercentage)}
                  </span>
                </div>
              </div>

              {/* Profile & Methodology */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Col: Profile Description */}
                <div>
                  <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2" /> Perfil Detectado
                  </h3>
                  <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                    <h4 className="text-[#1FB6D5] font-bold text-lg mb-2">{selectedLead.profileName}</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selectedLead.profileDescription || 'No description available for this profile.'}
                    </p>
                  </div>

                  {/* Raw Concerns */}
                  {selectedLead.full_data?.primaryConcern && (
                    <div className="mt-4 p-3 bg-red-900/10 border border-red-900/30 rounded-md">
                      <span className="text-red-400 text-xs font-bold uppercase tracking-wider block mb-1">Motivo de contacto</span>
                      <p className="text-sm text-slate-300">{selectedLead.full_data?.primaryConcern[0]}</p>
                    </div>
                  )}
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
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-end gap-4">
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white" onClick={() => createProjectFromLead(selectedLead)}>
                  <Briefcase className="w-4 h-4 mr-2" /> Convertir en Proyecto
                </Button>
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
  );
};

export default AdminLeads;
