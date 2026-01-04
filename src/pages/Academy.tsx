import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ResourceTopic, ResourceType, AcademyResource } from '../types';
import { Play, FileText, LayoutTemplate, Clock, ArrowRight, BookOpen, AlertCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

// Helper components defined before Academy to ensure types are resolved correctly
interface ResourceCardProps {
  resource: AcademyResource;
  highlighted?: boolean;
  hasAccess: boolean;
  onClick: (resource: AcademyResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, highlighted = false, hasAccess, onClick }) => {
  const getIcon = (type: ResourceType) => {
    switch (type) {
      case 'video': return <Play className="w-3 h-3 ml-1" fill="currentColor" />;
      case 'template': return <LayoutTemplate className="w-3 h-3 ml-1" />;
      default: return <FileText className="w-3 h-3 ml-1" />;
    }
  };

  return (
    <div
      onClick={() => onClick(resource)}
      className={`group h-full flex flex-col bg-slate-900 rounded-xl border transition-all duration-300 cursor-pointer ${hasAccess ? 'hover:-translate-y-1 hover:border-[#1FB6D5]/40 active:translate-y-0 active:scale-[0.98]' : 'opacity-75'} ${highlighted ? 'border-[#1FB6D5]/50 shadow-lg shadow-[#1FB6D5]/10' : 'border-slate-800'}`}
    >
      <div className="p-5 flex-grow relative">
        {!hasAccess && (
          <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full text-xs font-bold border border-amber-500/30 flex items-center z-10 transition-transform group-hover:scale-110">
            <Lock className="w-2.5 h-2.5 mr-1" /> Premium
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${highlighted ? 'bg-[#1FB6D5]/20 text-[#1FB6D5]' : 'bg-slate-800 text-slate-400'}`}>
            {resource.type} {getIcon(resource.type)}
          </span>
          {resource.duration && (
            <span className="text-[10px] font-bold text-slate-500 flex items-center uppercase tracking-tight">
              <Clock className="w-3 h-3 mr-1 text-slate-600" /> {resource.duration}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#1FB6D5] transition-colors line-clamp-2 leading-tight font-space">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
          {resource.summary || resource.description}
        </p>
      </div>

      <div className="px-5 py-4 border-t border-slate-800/50 flex flex-wrap gap-2">
        {(resource.letters7p || ['O']).map(l => (
          <span key={l} title={`Pilar: ${l}`} className="w-6 h-6 rounded bg-slate-800 text-slate-500 text-[10px] font-bold flex items-center justify-center border border-slate-700/50">
            {l.charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );
};

interface FilterButtonProps {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${active ? 'bg-[#1FB6D5] text-[#021019] shadow-lg shadow-[#1FB6D5]/20' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white hover:border-slate-700'}`}
  >
    {children}
  </button>
);

const Academy = () => {
  const { user, isAdmin, isConsultant } = useAuth();
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [topicFilter, setTopicFilter] = useState<ResourceTopic | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [selectedResource, setSelectedResource] = useState<AcademyResource | null>(null);

  useEffect(() => {
    // Handle body class for modal focus
    if (selectedResource) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedResource]);

  useEffect(() => {
    const fetchResources = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('recursos_academia')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        const mapped: AcademyResource[] = data.map((r: any) => ({
          id: r.id,
          title: r.titulo,
          type: r.tipo === 'plantilla' ? 'template' : r.tipo === 'guia' ? 'guide' : 'video',
          duration: r.duracion || '5 min',
          topics: r.topics || ['general'],
          letters7p: r.pilares ? (Array.isArray(r.pilares) ? r.pilares : [r.pilares]) : ['O'],
          summary: r.descripcion,
          description: r.descripcion,
          idealFor: r.publico_ideal ? [r.publico_ideal] : ['Todos'],
          actionSteps: [],
          recommendedTrigger: [],
          downloadUrl: r.url,
          es_premium: r.es_premium
        }));
        setResources(mapped);
      }
      setLoading(false);
    };

    fetchResources();
  }, []);

  const hasAccess = (resource: AcademyResource) => {
    if (!resource.es_premium) return true;
    return isAdmin || isConsultant;
  };

  const filteredResources = resources.filter(res => {
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    const matchesTopic = topicFilter === 'all' || (res.topics && res.topics.includes(topicFilter));
    return matchesType && matchesTopic;
  });

  const topics: ResourceTopic[] = ['finanzas', 'operaciones', 'equipo', 'marketing', 'tecnologia', 'cliente'];

  return (
    <Layout>
      <div className="bg-slate-1000 min-h-screen pb-24">
        {/* Header - Modern Dark Style */}
        <div className="relative bg-[#021019] border-b border-slate-800 pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1FB6D5]/10 rounded-full blur-[100px] -z-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-space tracking-tight">Academia Octopus</h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Herramientas, guías y masterclasses exclusivas para dueños y gerentes que buscan dominar su operación.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

          {/* Filters Bar */}
          <div className="mb-12 flex flex-col lg:flex-row gap-6 justify-between items-center bg-slate-900/40 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex flex-wrap justify-center gap-3">
              <FilterButton active={topicFilter === 'all'} onClick={() => setTopicFilter('all')}>Todos</FilterButton>
              {topics.map(topic => (
                <FilterButton key={topic} active={topicFilter === topic} onClick={() => setTopicFilter(topic)}>
                  {topic}
                </FilterButton>
              ))}
            </div>

            <div className="flex gap-2 min-w-[220px]">
              <select
                className="w-full bg-slate-800 border-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider p-3 focus:ring-2 focus:ring-[#1FB6D5] outline-none transition-all"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ResourceType | 'all')}
              >
                <option value="all">TODOS LOS FORMATOS</option>
                <option value="video">VIDEOS</option>
                <option value="guide">GUÍAS</option>
                <option value="template">PLANTILLAS</option>
              </select>
            </div>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-[#1FB6D5]/20 border-t-[#1FB6D5] rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Cargando Biblioteca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredResources.length > 0 ? (
                filteredResources.map(res => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    hasAccess={hasAccess(res)}
                    onClick={(resource) => setSelectedResource(resource)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-32 border-2 border-dashed border-slate-800 rounded-3xl">
                  <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No se encontraron recursos con estos filtros.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DETALLE MODAL */}
      {selectedResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#021019] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">

            {/* Header Badge & Image Placeholder */}
            <div className="h-2 bg-[#1FB6D5]"></div>

            <div className="p-8 md:p-10">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em]">
                    {selectedResource.type}
                  </span>
                  {selectedResource.duration && (
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em] flex items-center">
                      <Clock size={12} className="mr-1" /> {selectedResource.duration}
                    </span>
                  )}
                </div>
                {!hasAccess(selectedResource) && (
                  <div className="bg-amber-500 text-[#021019] px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center shadow-lg shadow-amber-500/10">
                    <Lock size={12} className="mr-1" /> Contenido Premium
                  </div>
                )}
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 font-space leading-tight">
                {selectedResource.title}
              </h2>

              <div className="prose prose-invert max-w-none">
                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                  {selectedResource.description || selectedResource.summary}
                </p>

                {selectedResource.idealFor && selectedResource.idealFor.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-[#1FB6D5] text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ArrowRight size={14} /> Ideal para
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedResource.idealFor.map(target => (
                        <span key={target} className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
                {hasAccess(selectedResource) ? (
                  <a
                    href={selectedResource.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-grow"
                  >
                    <Button className="w-full bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold py-4 rounded-2xl group">
                      Acceder al Recurso
                      <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </a>
                ) : (
                  <div className="flex-grow bg-slate-900/50 border border-slate-700/50 p-4 rounded-2xl text-center">
                    <p className="text-xs text-slate-500 mb-2">Este recurso requiere una suscripción activa o rol administrativo.</p>
                    <Button variant="outline" className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 font-bold py-3 rounded-xl">
                      Consultar Acceso Premium
                    </Button>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedResource(null)}
                  className="sm:px-10 py-4 border-slate-700 rounded-2xl font-bold hover:bg-slate-800"
                >
                  Volver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Academy;