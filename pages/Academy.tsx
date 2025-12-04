import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ACADEMY_RESOURCES, LEARNING_PATHS } from '../constants';
import { ResourceTopic, ResourceType, AcademyResource } from '../types';
import { Play, FileText, LayoutTemplate, Clock, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

// Helper components defined before Academy to ensure types are resolved correctly
interface ResourceCardProps {
  resource: AcademyResource;
  highlighted?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, highlighted = false }) => {
  const getIcon = (type: ResourceType) => {
    switch (type) {
      case 'video': return <Play className="w-3 h-3 ml-1" fill="currentColor"/>;
      case 'template': return <LayoutTemplate className="w-3 h-3 ml-1"/>;
      default: return <FileText className="w-3 h-3 ml-1"/>;
    }
  };

  return (
    <Link to={`/academy/${resource.id}`} className="group h-full">
      <div className={`h-full flex flex-col bg-slate-900 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${highlighted ? 'border-cyan-500/50 shadow-lg shadow-cyan-900/10' : 'border-slate-800 hover:border-slate-600'}`}>
        {/* Type Badge */}
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start mb-4">
             <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${highlighted ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
               {resource.type} {getIcon(resource.type)}
             </span>
             <span className="text-xs text-slate-500 flex items-center">
               <Clock className="w-3 h-3 mr-1"/> {resource.duration}
             </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-sm text-slate-400 line-clamp-3">
            {resource.summary}
          </p>
        </div>
        
        <div className="px-5 py-4 border-t border-slate-800/50 flex gap-2">
           {resource.letters7p.map(l => (
             <span key={l} className="w-6 h-6 rounded bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center">
               {l.charAt(0)}
             </span>
           ))}
        </div>
      </div>
    </Link>
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
  const [topicFilter, setTopicFilter] = useState<ResourceTopic | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');

  // Simulated diagnostic result to show recommendations
  const mockDiagnosticIssues = ['high_cogs', 'low_order']; 

  const recommendedResources = ACADEMY_RESOURCES.filter(res => 
    res.recommendedTrigger?.some(trigger => mockDiagnosticIssues.includes(trigger))
  );

  const filteredResources = ACADEMY_RESOURCES.filter(res => {
    const matchesTopic = topicFilter === 'all' || res.topics.includes(topicFilter);
    const matchesType = typeFilter === 'all' || res.type === typeFilter;
    return matchesTopic && matchesType;
  });

  const topicLabels: Record<string, string> = {
    finanzas: 'Finanzas',
    operaciones: 'Operaciones',
    equipo: 'Equipo',
    marketing: 'Marketing',
    tecnologia: 'Tecnología',
    cliente: 'Cliente'
  };

  return (
    <Layout>
      <div className="bg-slate-950 min-h-screen pb-16">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 pt-16 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-extrabold text-white mb-4">Academia Octopus</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Videos, guías y plantillas para ordenar tu negocio paso a paso. Sin relleno.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          
          {/* Recommendations Block */}
          {recommendedResources.length > 0 && (
            <div className="mb-16 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <AlertCircle className="w-6 h-6 text-cyan-400 mr-2" />
                Recomendado según tu diagnóstico
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedResources.map(res => (
                  <ResourceCard key={res.id} resource={res} highlighted />
                ))}
              </div>
            </div>
          )}

          {/* Learning Paths */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6">¿No sabés por dónde arrancar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LEARNING_PATHS.map(path => (
                <div key={path.id} className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-6 rounded-xl hover:border-cyan-500/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">{path.title}</h3>
                  <p className="text-slate-400 text-sm mb-4">{path.description}</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase tracking-wider">
                    {path.resourceIds.length} Recursos <ArrowRight className="w-4 h-4"/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-slate-800 pb-6">
             <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
                <FilterButton active={topicFilter === 'all'} onClick={() => setTopicFilter('all')}>Todos</FilterButton>
                {Object.entries(topicLabels).map(([key, label]) => (
                  <FilterButton key={key} active={topicFilter === key} onClick={() => setTopicFilter(key as ResourceTopic)}>
                    {label}
                  </FilterButton>
                ))}
             </div>
             <div className="flex gap-2">
                <select 
                  className="bg-slate-900 border border-slate-700 text-slate-300 rounded-md text-sm p-2 focus:ring-cyan-500"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.length > 0 ? (
              filteredResources.map(res => (
                <ResourceCard key={res.id} resource={res} />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-slate-500">
                No hay recursos que coincidan con estos filtros.
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Academy;