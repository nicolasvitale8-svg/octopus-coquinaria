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
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, highlighted = false, hasAccess }) => {
  const getIcon = (type: ResourceType) => {
    switch (type) {
      case 'video': return <Play className="w-3 h-3 ml-1" fill="currentColor" />;
      case 'template': return <LayoutTemplate className="w-3 h-3 ml-1" />;
      default: return <FileText className="w-3 h-3 ml-1" />;
    }
  };

  const Content = (
    <div className={`h-full flex flex-col bg-slate-900 rounded-xl border transition-all duration-300 ${hasAccess ? 'hover:-translate-y-1 hover:border-slate-600' : 'opacity-75'} ${highlighted ? 'border-cyan-500/50 shadow-lg shadow-cyan-900/10' : 'border-slate-800'}`}>
      {/* Type Badge */}
      <div className="p-5 flex-grow relative">
        {!hasAccess && (
          <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-500 px-2 py-1 rounded-full text-xs font-bold border border-amber-500/30 flex items-center z-10">
            <Lock className="w-3 h-3 mr-1" /> Premium
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${highlighted ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
            {resource.type} {getIcon(resource.type)}
          </span>
          {resource.duration && (
            <span className="text-xs text-slate-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" /> {resource.duration}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-3">
          {resource.summary || resource.description}
        </p>
      </div>

      <div className="px-5 py-4 border-t border-slate-800/50 flex gap-2">
        {(resource.letters7p || ['O']).map(l => (
          <span key={l} className="w-6 h-6 rounded bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center">
            {l.charAt(0)}
          </span>
        ))}
      </div>
    </div>
  );

  if (!hasAccess) {
    return (
      <div className="h-full cursor-not-allowed group relative">
        {Content}
      </div>
    );
  }

  return (
    <a href={resource.downloadUrl || '#'} target="_blank" rel="noopener noreferrer" className="group h-full block">
      {Content}
    </a>
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
    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
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
          duration: '5 min', // Default
          topics: r.topics || ['general'], // Traer de DB
          letters7p: ['O'], // Default
          summary: r.descripcion,
          description: r.descripcion,
          idealFor: ['Todos'],
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
    // Premium access logic: Admins and Consultants have access
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
      <div className="bg-slate-950 min-h-screen pb-16">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-4">Academia Octopus</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Recursos exclusivos, guías y herramientas para escalar.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

          {/* Filters */}
          <div className="mb-8 flex flex-col lg:flex-row gap-6 justify-between items-center border-b border-slate-800 pb-6">
            {/* Topic Pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <FilterButton
                active={topicFilter === 'all'}
                onClick={() => setTopicFilter('all')}
              >
                Todos
              </FilterButton>
              {topics.map(topic => (
                <FilterButton
                  key={topic}
                  active={topicFilter === topic}
                  onClick={() => setTopicFilter(topic)}
                >
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </FilterButton>
              ))}
            </div>

            {/* Type Dropdown */}
            <div className="flex gap-2 min-w-[200px]">
              <select
                className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-md text-sm p-2 focus:ring-cyan-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ResourceType | 'all')}
              >
                <option value="all">Cualquier formato</option>
                <option value="video">Videos</option>
                <option value="guide">Guías</option>
                <option value="template">Plantillas</option>
              </select>
            </div>
          </div>

          {/* Resources Grid */}
          {loading ? (
            <div className="text-center py-12 text-slate-500">Cargando biblioteca...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredResources.length > 0 ? (
                filteredResources.map(res => (
                  <ResourceCard
                    key={res.id}
                    resource={res}
                    hasAccess={hasAccess(res)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No hay recursos cargados aún.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Academy;