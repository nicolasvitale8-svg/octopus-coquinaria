import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { AcademyResource, LearningPath, ResourceCategory, ResourceFormat, ResourceAccess } from '../types';
import {
  Play, FileText, LayoutTemplate, Clock, ArrowRight, BookOpen,
  Lock, ArrowLeft, Target, GraduationCap, Zap, Star, ChevronRight, ClipboardList
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { getResources, getLearningPaths, getRecommendedContent } from '../services/academyService';

// --- HELPER COMPONENTS ---

interface ResourceCardProps {
  resource: AcademyResource;
  highlighted?: boolean;
  hasAccess: boolean;
  onClick: (resource: AcademyResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, highlighted = false, hasAccess, onClick }) => {
  const getIcon = (format: ResourceFormat) => {
    switch (format) {
      case 'VIDEO': return <Play className="w-3 h-3 ml-1" fill="currentColor" />;
      case 'TEMPLATE': return <LayoutTemplate className="w-3 h-3 ml-1" />;
      case 'TIP': return <Zap className="w-3 h-3 ml-1" />;
      case 'FORM': return <ClipboardList className="w-3 h-3 ml-1" />;
      default: return <FileText className="w-3 h-3 ml-1" />;
    }
  };

  return (
    <div
      onClick={() => onClick(resource)}
      className={`group h-full flex flex-col bg-slate-900/50 rounded-2xl border transition-all duration-300 cursor-pointer ${hasAccess ? 'hover:-translate-y-1 hover:border-[#1FB6D5]/40 active:translate-y-0 active:scale-[0.98]' : 'opacity-75 grayscale-[0.5]'} ${highlighted ? 'border-[#1FB6D5]/50 shadow-lg shadow-[#1FB6D5]/10 bg-slate-900' : 'border-slate-800'}`}
    >
      <div className="p-6 flex-grow relative">
        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${highlighted ? 'bg-[#1FB6D5]/20 text-[#1FB6D5]' : 'bg-slate-800 text-slate-400'}`}>
            {resource.format} {getIcon(resource.format)}
          </span>
          <div className="flex items-center gap-2">
            {!hasAccess && <Lock className="w-3 h-3 text-amber-500" />}
            <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
              <Clock className="w-3 h-3 mr-1" /> {resource.durationMinutes} min
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#1FB6D5] transition-colors line-clamp-2 leading-tight font-space">
          {resource.title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed italic mb-3">
          "{resource.outcome}"
        </p>
      </div>

      <div className="px-6 py-4 border-t border-slate-800/50 flex justify-between items-center bg-slate-900/40 rounded-b-2xl">
        <span className="text-[10px] font-bold text-[#1FB6D5] uppercase tracking-widest">{resource.category}</span>
        <span className="text-[10px] font-bold text-slate-600 uppercase italic">{resource.impactTag}</span>
      </div>
    </div>
  );
};

const PathCard: React.FC<{ path: LearningPath; hasAccess: boolean; onClick: () => void }> = ({ path, hasAccess, onClick }) => (
  <div
    onClick={onClick}
    className={`group bg-gradient-to-br from-slate-900 to-[#021019] border border-slate-800 rounded-3xl p-8 hover:border-[#1FB6D5]/40 transition-all cursor-pointer relative overflow-hidden ${!hasAccess ? 'opacity-80' : ''}`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-[#1FB6D5]/5 rounded-full blur-3xl group-hover:bg-[#1FB6D5]/10 transition-colors"></div>
    <div className="relative z-10">
      <div className="flex justify-between items-center mb-6">
        <span className="bg-[#00344F] text-[#1FB6D5] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-[#1FB6D5]/20">RUTA: {path.category}</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-bold">{path.resourceIds.length} módulos</span>
          {!hasAccess && <Lock className="w-4 h-4 text-amber-500" />}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 font-space group-hover:text-[#1FB6D5] transition-colors">{path.title}</h3>
      <p className="text-slate-400 mb-8 line-clamp-2">{path.subtitle || 'Domina esta área con nuestro plan estructurado.'}</p>
      <div className="flex items-center text-[#1FB6D5] font-bold text-sm">
        Empezar ruta <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

const Academy = () => {
  const { profile, isAdmin, isConsultant } = useAuth();
  const navigate = useNavigate();
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResource, setSelectedResource] = useState<AcademyResource | null>(null);

  const plan = profile?.plan || 'FREE';
  const scores = profile?.diagnostic_scores || {};

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resData, pathsData] = await Promise.all([
          getResources(),
          getLearningPaths()
        ]);
        setResources(resData);
        setPaths(pathsData);
      } catch (e) {
        console.error("Error loading Academy data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const { topCategory, recommendedResources, hasScores } = getRecommendedContent(
    resources,
    paths,
    scores,
    plan
  );

  const pinnedResources = resources.filter(r => r.isPinned);
  const microtips = resources.filter(r => r.format === 'TIP');

  const canAccess = (accessLevel: ResourceAccess) => {
    if (accessLevel === 'PUBLIC' || accessLevel === 'FREE') return true;
    return plan === 'PRO' || isAdmin || isConsultant;
  };

  return (
    <Layout>
      <div className="bg-slate-1000 min-h-screen pb-24">
        {/* Header */}
        <div className="relative bg-[#021019] border-b border-slate-800 pt-8 pb-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1FB6D5]/10 rounded-full blur-[100px] -z-0"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
            >
              <div className="p-1.5 rounded-full bg-slate-900/50 border border-slate-800 group-hover:border-[#1FB6D5]/30 transition-all">
                <ArrowLeft className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Volver al Inicio</span>
            </button>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 font-space tracking-tight">Academia Octopus</h1>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Aprendizaje guiado por tu diagnóstico para escalar tu negocio sin caos.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-20 pb-20">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-12 h-12 border-4 border-[#1FB6D5]/20 border-t-[#1FB6D5] rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Cargando Academia</p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1: POR DÓNDE EMPEZAR */}
              <section className="animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                  <Star className="text-[#1FB6D5] w-5 h-5" />
                  <h2 className="text-xl font-bold text-white font-space uppercase tracking-widest">Por dónde empezar</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {pinnedResources.map(res => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      hasAccess={canAccess(res.access)}
                      highlighted={true}
                      onClick={setSelectedResource}
                    />
                  ))}
                  {pinnedResources.length === 0 && (
                    <div className="col-span-full bg-slate-900/30 p-10 rounded-3xl border border-slate-800 text-center">
                      <p className="text-slate-500 italic">No hay contenido destacado actualmente.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* BLOQUE 2: TU PRIORIDAD AHORA */}
              <section className="relative overflow-hidden p-1 rounded-[2.5rem] bg-gradient-to-r from-[#1FB6D5]/20 via-transparent to-transparent">
                <div className="bg-[#021019] p-8 md:p-12 rounded-[2.3rem] border border-slate-800/50">
                  <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/2">
                      <div className="inline-flex items-center px-4 py-1 rounded-full bg-[#1FB6D5]/10 text-[#1FB6D5] text-[10px] font-bold uppercase tracking-widest mb-6 border border-[#1FB6D5]/20">
                        <Target className="w-3 h-3 mr-2" /> Recomendación Inteligente
                      </div>

                      {hasScores && topCategory ? (
                        <>
                          <h2 className="text-4xl font-extrabold text-white mb-4 font-space">Tu prioridad: <span className="text-[#1FB6D5]">{topCategory}</span></h2>
                          <p className="text-slate-400 text-lg mb-8 max-w-lg leading-relaxed">
                            Basado en tu diagnóstico, enfocarte en <strong>{topCategory.toLowerCase()}</strong> tendrá el mayor impacto en tu rentabilidad ahora mismo.
                          </p>
                          {plan === 'FREE' && (
                            <div className="p-6 bg-[#00344F]/30 border border-[#1FB6D5]/20 rounded-2xl mb-8">
                              <p className="text-[#1FB6D5] text-sm font-bold mb-4 flex items-center">
                                <Zap className="w-4 h-4 mr-2" /> ¡Upgrade a PRO para desbloquear todo!
                              </p>
                              <Link to="/quick-diagnostic">
                                <Button size="sm" className="bg-[#1FB6D5] text-[#021019] hover:bg-white text-xs px-6 py-3 rounded-lg font-bold">VER PLANES PRO</Button>
                              </Link>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h2 className="text-4xl font-extrabold text-white mb-6 font-space italic">¿Ya sabés por dónde empezar?</h2>
                          <p className="text-slate-400 text-lg mb-8 max-w-lg leading-relaxed">
                            Realizá el diagnóstico rápido para que nuestro algoritmo ordene tu aprendizaje y detecte tus cuellos de botella.
                          </p>
                          <Link to="/quick-diagnostic">
                            <Button className="bg-[#1FB6D5] text-[#021019] hover:bg-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
                              Hacer Diagnóstico <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="lg:w-1/2 w-full space-y-4">
                      {recommendedResources.map(res => (
                        <div
                          key={res.id}
                          onClick={() => setSelectedResource(res)}
                          className="flex items-center p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-[#1FB6D5]/40 transition-all cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-[#1FB6D5] font-bold group-hover:bg-[#1FB6D5] group-hover:text-[#021019] transition-colors">
                            <Play size={20} />
                          </div>
                          <div className="ml-4 flex-grow">
                            <h4 className="text-white font-bold text-sm leading-tight group-hover:text-[#1FB6D5]">{res.title}</h4>
                            <p className="text-slate-500 text-[10px] uppercase font-bold mt-1 tracking-wider">{res.impactTag} • {res.durationMinutes} MIN</p>
                          </div>
                          <ChevronRight className="text-slate-700 group-hover:text-[#1FB6D5]" size={16} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* BLOQUE 3: RUTAS DE APRENDIZAJE */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="text-[#1FB6D5] w-6 h-6" />
                    <h2 className="text-2xl font-bold text-white font-space tracking-tight">Rutas de Maestría</h2>
                  </div>
                  {plan === 'FREE' && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase tracking-widest">PRO Only</span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {paths.map(path => (
                    <PathCard
                      key={path.id}
                      path={path}
                      hasAccess={canAccess(path.access)}
                      onClick={() => { }}
                    />
                  ))}
                  {paths.length === 0 && (
                    <p className="col-span-full text-slate-600 italic">No hay rutas de aprendizaje publicadas.</p>
                  )}
                </div>
              </section>

              {/* BLOQUE EXTRA: BIBLIOTECA DE HERRAMIENTAS */}
              <section className="animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                  <LayoutTemplate className="text-[#1FB6D5] w-6 h-6" />
                  <h2 className="text-2xl font-bold text-white font-space tracking-tight">Biblioteca de Herramientas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {resources.filter(r => !r.isPinned && r.format !== 'TIP').map(res => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      hasAccess={canAccess(res.access)}
                      onClick={setSelectedResource}
                    />
                  ))}
                  {resources.filter(r => !r.isPinned && r.format !== 'TIP').length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-900/20 rounded-3xl border border-slate-800/50">
                      <p className="text-slate-500 italic">Próximamente más herramientas...</p>
                    </div>
                  )}
                </div>
              </section>

              {/* BLOQUE 4: MICROTIPS */}
              <section className="bg-slate-900/30 p-10 rounded-[3rem] border border-slate-800/80">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <div className="inline-block p-3 rounded-2xl bg-amber-500/10 text-amber-500 mb-6">
                      <Zap size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 font-space uppercase tracking-tighter">Microtips de Gestión</h2>
                    <p className="text-slate-400">Implementaciones rápidas de menos de 1 minuto.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {microtips.slice(0, 4).map(tip => (
                      <div key={tip.id} className="p-6 bg-[#021019] border border-slate-800 rounded-3xl group hover:border-amber-500/30 transition-all cursor-pointer" onClick={() => setSelectedResource(tip)}>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.2em]">{tip.category}</span>
                          <span className="text-slate-600 text-[10px] font-bold">{tip.durationMinutes} MIN</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-3 group-hover:text-amber-500 transition-colors font-space leading-tight">{tip.title}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2 italic">"{tip.outcome}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-[#021019] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            <div className="h-2 bg-[#1FB6D5] flex-shrink-0"></div>
            <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {selectedResource.format}
                  </span>
                  <span className="text-slate-500 text-[10px] font-bold uppercase flex items-center">
                    <Clock size={12} className="mr-1" /> {selectedResource.durationMinutes} min
                  </span>
                </div>
                {!canAccess(selectedResource.access) && (
                  <div className="bg-amber-500 text-[#021019] px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center font-bold">
                    <Lock size={12} className="mr-1" /> Premium
                  </div>
                )}
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 font-space leading-tight">{selectedResource.title}</h2>
              <p className="text-[#1FB6D5] font-bold text-sm uppercase tracking-widest mb-8 italic">Logro: {selectedResource.outcome}</p>

              <div className="space-y-6">
                <p className="text-slate-400 text-lg leading-relaxed whitespace-pre-line">{selectedResource.description}</p>

                {selectedResource.actionSteps && selectedResource.actionSteps.length > 0 && (
                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <ArrowRight size={14} className="text-[#1FB6D5]" /> Hoja de Ruta
                    </h4>
                    <ul className="space-y-3">
                      {selectedResource.actionSteps.map((step, idx) => (
                        <li key={idx} className="text-slate-300 text-sm flex gap-3">
                          <span className="text-[#1FB6D5] font-bold">{idx + 1}.</span> {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col sm:flex-row gap-4">
                {canAccess(selectedResource.access) ? (
                  <a href={selectedResource.downloadUrl} target="_blank" rel="noreferrer" className="flex-grow">
                    <Button className="w-full bg-[#1FB6D5] text-[#021019] hover:bg-white font-bold py-4 rounded-2xl group text-sm uppercase tracking-widest">
                      Comenzar Ahora <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </a>
                ) : (
                  <div className="flex-grow bg-[#00344F]/20 border border-[#1FB6D5]/20 p-5 rounded-2xl text-center">
                    <p className="text-xs text-[#1FB6D5] font-bold mb-3 uppercase tracking-tighter">Este contenido requiere plan PRO</p>
                    <Link to="/quick-diagnostic">
                      <Button variant="outline" className="w-full border-[#1FB6D5] text-[#1FB6D5] hover:bg-[#1FB6D5] hover:text-[#021019] font-bold py-3 rounded-xl text-xs">
                        ACTUALIZAR MI PLAN
                      </Button>
                    </Link>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedResource(null)}
                  className="sm:px-10 py-4 border-slate-700 rounded-2xl font-bold hover:bg-slate-800 text-sm"
                >
                  Cerrar
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