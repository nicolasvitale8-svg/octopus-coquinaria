import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { AcademyResource, LearningPath, ResourceFormat, ResourceAccess } from '../types';
import {
  Play, FileText, LayoutTemplate, Clock, ArrowRight, BookOpen,
  Lock, ArrowLeft, Target, GraduationCap, Zap, Star, ChevronRight, ClipboardList, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { getResources, getLearningPaths, getRecommendedContent } from '../services/academyService';

/**
 * Academy.tsx — Página pública /academy CEPHALOPOD HUD.
 * Tokens phosphor, marcos rectos con brackets, doc-codes,
 * font-mono para tracking, font-display para títulos.
 */

// --- HELPERS UI ---

const CornerBrackets: React.FC<{ size?: string }> = ({ size = 'w-2.5 h-2.5' }) => (
  <>
    <span aria-hidden="true" className={`pointer-events-none absolute top-0 left-0 ${size} border-l border-t z-10`} style={{ borderColor: 'var(--color-primary)' }} />
    <span aria-hidden="true" className={`pointer-events-none absolute top-0 right-0 ${size} border-r border-t z-10`} style={{ borderColor: 'var(--color-primary)' }} />
    <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-0 ${size} border-l border-b z-10`} style={{ borderColor: 'var(--color-primary)' }} />
    <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 right-0 ${size} border-r border-b z-10`} style={{ borderColor: 'var(--color-primary)' }} />
  </>
);

const SectionHeader: React.FC<{ docCode: string; title: string; icon: React.ReactNode; subtitle?: string }> = ({ docCode, title, icon, subtitle }) => (
  <div className="mb-6">
    <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
      — {docCode}
    </div>
    <div className="flex items-center gap-2">
      <span style={{ color: 'var(--color-primary)' }}>{icon}</span>
      <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h2>
    </div>
    {subtitle && (
      <p className="font-mono text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
    )}
  </div>
);

// --- RESOURCE CARD HUD ---

interface ResourceCardProps {
  resource: AcademyResource;
  highlighted?: boolean;
  hasAccess: boolean;
  onClick: (resource: AcademyResource) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, highlighted = false, hasAccess, onClick }) => {
  const getFormatIcon = (format: ResourceFormat) => {
    switch (format) {
      case 'VIDEO': return <Play className="w-3 h-3" fill="currentColor" />;
      case 'TEMPLATE': return <LayoutTemplate className="w-3 h-3" />;
      case 'TIP': return <Zap className="w-3 h-3" />;
      case 'FORM': return <ClipboardList className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div
      onClick={() => onClick(resource)}
      className={`group relative h-full flex flex-col border transition-all duration-200 cursor-pointer ${
        hasAccess ? 'hover:-translate-y-[2px]' : 'opacity-70'
      }`}
      style={{
        background: highlighted ? 'var(--bg-base)' : 'var(--bg-surface)',
        borderColor: highlighted ? 'var(--color-primary)' : 'var(--border-subtle)'
      }}
      onMouseEnter={(e) => { if (hasAccess) e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = highlighted ? 'var(--color-primary)' : 'var(--border-subtle)'; }}
    >
      {highlighted && <CornerBrackets />}

      <div className="p-5 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <span
            className="inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] border"
            style={{
              background: 'var(--bg-base)',
              color: 'var(--color-primary)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {getFormatIcon(resource.format)} {resource.format}
          </span>
          <div className="flex items-center gap-2">
            {!hasAccess && <Lock className="w-3 h-3" style={{ color: 'var(--color-warning)' }} strokeWidth={2} />}
            <span className="font-mono text-[10px] font-bold uppercase flex items-center" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3 mr-1" strokeWidth={1.75} /> {resource.durationMinutes} MIN
            </span>
          </div>
        </div>

        <h3 className="font-display text-lg font-bold mb-2 line-clamp-2 leading-tight transition-colors group-hover:text-[var(--color-primary)]" style={{ color: 'var(--text-primary)' }}>
          {resource.title}
        </h3>
        <p className="font-mono text-[12px] line-clamp-2 leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
          › {resource.outcome}
        </p>
      </div>

      <div
        className="px-5 py-3 border-t flex justify-between items-center"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
      >
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-primary)' }}>
          {resource.category}
        </span>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
          {resource.impactTag}
        </span>
      </div>
    </div>
  );
};

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
      <div style={{ background: 'var(--bg-base)' }} className="min-h-screen pb-24">
        {/* HEADER HUD */}
        <div
          className="relative border-b pt-8 pb-12 overflow-hidden"
          style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mb-8 group transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="p-1.5 border transition-all"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] group-hover:text-[var(--color-primary)] transition-colors">
                Volver al Inicio
              </span>
            </button>

            <div className="text-center max-w-3xl mx-auto">
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] mb-3" style={{ color: 'var(--color-primary)' }}>
                — CPD-PUB-ACA-001
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
                Academia <span style={{ color: 'var(--color-primary)' }}>Cephalopod</span>
              </h1>
              <p className="font-mono text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Aprendizaje guiado por tu diagnóstico para escalar tu negocio sin caos.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16 pb-20">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-2 animate-spin" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--color-primary)' }}></div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--text-muted)' }}>
                [ CARGANDO ACADEMIA ]
              </p>
            </div>
          ) : (
            <>
              {/* BLOQUE 1: POR DÓNDE EMPEZAR */}
              <section className="animate-fade-in">
                <SectionHeader
                  docCode="CPD-PUB-ACA-PIN-001"
                  title="Por dónde empezar"
                  icon={<Star className="w-5 h-5" strokeWidth={1.75} />}
                  subtitle="Recursos destacados para arrancar."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div
                      className="col-span-full p-10 border text-center"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <p className="font-mono text-xs uppercase tracking-[0.22em] italic" style={{ color: 'var(--text-muted)' }}>
                        [ SIN CONTENIDO DESTACADO ]
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* BLOQUE 2: RECOMENDACIÓN INTELIGENTE */}
              <section
                className="relative border overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
              >
                <CornerBrackets size="w-3 h-3" />

                <div className="p-8 md:p-12">
                  <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="lg:w-1/2">
                      <div
                        className="inline-flex items-center px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.28em] border mb-6"
                        style={{
                          background: 'var(--bg-base)',
                          color: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)'
                        }}
                      >
                        <Target className="w-3 h-3 mr-2" strokeWidth={2} /> Recomendación Inteligente
                      </div>

                      {hasScores && topCategory ? (
                        <>
                          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            Tu prioridad: <span style={{ color: 'var(--color-primary)' }}>{topCategory}</span>
                          </h2>
                          <p className="font-mono text-sm md:text-base mb-6 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Basado en tu diagnóstico, enfocarte en <strong style={{ color: 'var(--text-primary)' }}>{topCategory.toLowerCase()}</strong> tendrá el mayor impacto en tu rentabilidad ahora mismo.
                          </p>
                          {plan === 'FREE' && (
                            <div
                              className="p-5 border mb-6"
                              style={{ background: 'var(--bg-base)', borderColor: 'var(--color-primary)' }}
                            >
                              <p className="font-mono text-[12px] font-bold uppercase tracking-[0.18em] mb-3 flex items-center" style={{ color: 'var(--color-primary)' }}>
                                <Zap className="w-3 h-3 mr-2" strokeWidth={2} /> Upgrade a PRO para desbloquear todo
                              </p>
                              <Link to="/quick-diagnostic">
                                <Button variant="primary" size="sm">VER PLANES PRO</Button>
                              </Link>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            ¿Ya sabés por dónde empezar?
                          </h2>
                          <p className="font-mono text-sm md:text-base mb-6 max-w-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            Realizá el diagnóstico rápido para que nuestro algoritmo ordene tu aprendizaje y detecte tus cuellos de botella.
                          </p>
                          <Link to="/quick-diagnostic">
                            <Button variant="primary" icon={ArrowRight}>Hacer Diagnóstico</Button>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="lg:w-1/2 w-full space-y-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--text-muted)' }}>
                        // RECURSOS SUGERIDOS
                      </div>
                      {recommendedResources.map(res => (
                        <div
                          key={res.id}
                          onClick={() => setSelectedResource(res)}
                          className="flex items-center p-3 border transition-all cursor-pointer group"
                          style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                        >
                          <div
                            className="w-10 h-10 border flex items-center justify-center transition-colors"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--color-primary)' }}
                          >
                            <Play size={16} strokeWidth={1.75} />
                          </div>
                          <div className="ml-3 flex-grow">
                            <h4 className="font-display font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{res.title}</h4>
                            <p className="font-mono text-[10px] uppercase font-bold mt-1 tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                              {res.impactTag} · {res.durationMinutes} MIN
                            </p>
                          </div>
                          <ChevronRight size={14} className="group-hover:text-[var(--color-primary)]" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* BLOQUE 3: RUTAS DE MAESTRÍA */}
              {(() => {
                const pathMap = new Map<string, AcademyResource[]>();
                resources.forEach(r => {
                  if (r.learningPath && r.learningPath.trim()) {
                    const key = r.learningPath.trim();
                    if (!pathMap.has(key)) pathMap.set(key, []);
                    pathMap.get(key)!.push(r);
                  }
                });

                if (pathMap.size === 0) return null;

                return (
                  <section>
                    <SectionHeader
                      docCode="CPD-PUB-ACA-PATH-001"
                      title="Rutas de Maestría"
                      icon={<GraduationCap className="w-6 h-6" strokeWidth={1.75} />}
                      subtitle="Programas estructurados por área."
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {Array.from(pathMap.entries()).map(([pathName, pathResources]) => {
                        const totalMinutes = pathResources.reduce((s, r) => s + r.durationMinutes, 0);
                        const hasPro = pathResources.some(r => r.access === 'PRO');
                        const mainCategory = pathResources[0]?.category || 'OPERACIONES';
                        const hasAccess = !hasPro || plan === 'PRO' || isAdmin || isConsultant;

                        return (
                          <div
                            key={pathName}
                            onClick={() => {
                              const firstRes = pathResources[0];
                              if (firstRes) setSelectedResource(firstRes);
                            }}
                            className={`group relative border p-6 transition-all cursor-pointer ${!hasAccess ? 'opacity-80' : ''}`}
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                          >
                            <CornerBrackets />

                            <div className="flex justify-between items-start mb-5">
                              <span
                                className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-1 border"
                                style={{
                                  background: 'var(--bg-base)',
                                  color: 'var(--color-primary)',
                                  borderColor: 'var(--color-primary)'
                                }}
                              >
                                RUTA · {mainCategory}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                                  {pathResources.length} MÓD · {totalMinutes} MIN
                                </span>
                                {hasPro && <Lock className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} strokeWidth={2} />}
                              </div>
                            </div>

                            <h3 className="font-display text-2xl font-bold mb-2 transition-colors group-hover:text-[var(--color-primary)]" style={{ color: 'var(--text-primary)' }}>
                              {pathName}
                            </h3>
                            <p className="font-mono text-[12px] mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {pathResources.map(r => r.title).join(' → ')}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-5">
                              {pathResources.map((r, i) => (
                                <span
                                  key={r.id}
                                  className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] px-2 py-1 border"
                                  style={{
                                    background: 'var(--bg-base)',
                                    color: 'var(--text-muted)',
                                    borderColor: 'var(--border-subtle)'
                                  }}
                                >
                                  {String(i + 1).padStart(2, '0')} · {r.title.length > 28 ? r.title.slice(0, 28) + '…' : r.title}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center font-mono text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-primary)' }}>
                              {hasAccess ? '› Empezar ruta' : '› Desbloquear con PRO'}
                              <ArrowRight className="ml-2 w-3.5 h-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })()}

              {/* BLOQUE 4: BIBLIOTECA DE HERRAMIENTAS */}
              <section className="animate-fade-in">
                <SectionHeader
                  docCode="CPD-PUB-ACA-LIB-001"
                  title="Biblioteca de Herramientas"
                  icon={<LayoutTemplate className="w-6 h-6" strokeWidth={1.75} />}
                  subtitle="Plantillas, guías y recursos descargables."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.filter(r => !r.isPinned && r.format !== 'TIP').map(res => (
                    <ResourceCard
                      key={res.id}
                      resource={res}
                      hasAccess={canAccess(res.access)}
                      onClick={setSelectedResource}
                    />
                  ))}
                  {resources.filter(r => !r.isPinned && r.format !== 'TIP').length === 0 && (
                    <div
                      className="col-span-full py-12 text-center border"
                      style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    >
                      <p className="font-mono text-xs uppercase tracking-[0.22em] italic" style={{ color: 'var(--text-muted)' }}>
                        [ PRÓXIMAMENTE MÁS HERRAMIENTAS ]
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* BLOQUE 5: MICROTIPS */}
              {microtips.length > 0 && (
                <section
                  className="relative border p-8 md:p-10"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <CornerBrackets size="w-3 h-3" />

                  <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                      <div
                        className="inline-flex items-center justify-center w-12 h-12 border mb-4"
                        style={{ background: 'var(--bg-base)', borderColor: 'var(--color-warning)', color: 'var(--color-warning)' }}
                      >
                        <Zap size={20} strokeWidth={1.75} />
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                        — CPD-PUB-ACA-TIP-001
                      </div>
                      <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        Microtips de Gestión
                      </h2>
                      <p className="font-mono text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                        Implementaciones rápidas en menos de 1 minuto.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {microtips.slice(0, 4).map(tip => (
                        <div
                          key={tip.id}
                          className="p-5 border group cursor-pointer transition-all"
                          style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
                          onClick={() => setSelectedResource(tip)}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-warning)'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--color-warning)' }}>
                              {tip.category}
                            </span>
                            <span className="font-mono text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                              {tip.durationMinutes} MIN
                            </span>
                          </div>
                          <h4 className="font-display text-base font-bold mb-2 leading-tight transition-colors group-hover:text-[var(--color-warning)]" style={{ color: 'var(--text-primary)' }}>
                            {tip.title}
                          </h4>
                          <p className="font-mono text-[11px] line-clamp-2 italic" style={{ color: 'var(--text-secondary)' }}>
                            › {tip.outcome}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* DETAIL MODAL HUD */}
      {selectedResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up"
            style={{ background: 'var(--bg-base)', borderColor: 'var(--border-subtle)' }}
          >
            <CornerBrackets size="w-3 h-3" />

            {/* Top stripe phosphor */}
            <div className="h-[3px] flex-shrink-0" style={{ background: 'var(--color-primary)' }}></div>

            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-1 border"
                    style={{ background: 'var(--bg-surface)', color: 'var(--color-primary)', borderColor: 'var(--border-subtle)' }}
                  >
                    {selectedResource.format}
                  </span>
                  <span className="font-mono text-[10px] font-bold uppercase flex items-center" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={12} className="mr-1" strokeWidth={1.75} /> {selectedResource.durationMinutes} MIN
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!canAccess(selectedResource.access) && (
                    <div
                      className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] px-2 py-1 border flex items-center"
                      style={{
                        background: 'rgba(255,177,42,0.10)',
                        color: 'var(--color-warning)',
                        borderColor: 'var(--color-warning)'
                      }}
                    >
                      <Lock size={11} className="mr-1" strokeWidth={2} /> PRO
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="p-1.5 transition-colors hover:text-[var(--color-primary)]"
                    style={{ color: 'var(--text-muted)' }}
                    title="Cerrar"
                  >
                    <X className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="font-mono text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--text-muted)' }}>
                — CPD-PUB-ACA-RES
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-2 leading-tight" style={{ color: 'var(--text-primary)' }}>
                {selectedResource.title}
              </h2>
              <p className="font-mono text-xs uppercase tracking-[0.22em] mb-6 italic" style={{ color: 'var(--color-primary)' }}>
                › Logro: {selectedResource.outcome}
              </p>

              <div className="space-y-5">
                <p className="font-mono text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
                  {selectedResource.description}
                </p>

                {selectedResource.actionSteps && selectedResource.actionSteps.length > 0 && (
                  <div className="pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h4 className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] mb-3 flex items-center gap-2" style={{ color: 'var(--color-primary)' }}>
                      <ArrowRight size={12} strokeWidth={2} /> // Hoja de Ruta
                    </h4>
                    <ul className="space-y-2">
                      {selectedResource.actionSteps.map((step, idx) => (
                        <li key={idx} className="font-mono text-[12px] flex gap-2" style={{ color: 'var(--text-primary)' }}>
                          <span className="font-bold" style={{ color: 'var(--color-primary)' }}>{String(idx + 1).padStart(2, '0')}.</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                {canAccess(selectedResource.access) ? (
                  <a href={selectedResource.downloadUrl} target="_blank" rel="noreferrer" className="flex-grow">
                    <Button variant="primary" className="w-full" icon={ArrowRight}>
                      Comenzar Ahora
                    </Button>
                  </a>
                ) : (
                  <div
                    className="flex-grow p-4 border text-center"
                    style={{ background: 'var(--bg-surface)', borderColor: 'var(--color-primary)' }}
                  >
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--color-primary)' }}>
                      Este contenido requiere plan PRO
                    </p>
                    <Link to="/quick-diagnostic">
                      <Button variant="primary" size="sm" className="w-full">
                        ACTUALIZAR MI PLAN
                      </Button>
                    </Link>
                  </div>
                )}
                <Button variant="ghost" onClick={() => setSelectedResource(null)}>
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
