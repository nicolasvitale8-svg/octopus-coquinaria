
import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import { METHODOLOGY_7P } from '../constants';
import { getResources } from '../services/academyService';
import { AcademyResource } from '../types';
import { ArrowRight, CheckCircle, AlertTriangle, Zap, X, Video, FileText, BarChart2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

// Level 3: Dynamic Pill Component
const DynamicPill = ({ pills }: { pills: string[] }) => {
  if (!pills || pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {pills.map((pill, idx) => (
        <span key={idx} className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold border border-[var(--color-primary)]/30">
          {pill}
        </span>
      ))}
    </div>
  );
};

const Methodology = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'videos' | 'notes' | null>(null);
  const [resources, setResources] = useState<AcademyResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Handle body class for modal focus
  useEffect(() => {
    if (selectedId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedId]);

  // Fetch resources on mount
  React.useEffect(() => {
    const loadResources = async () => {
      setLoadingResources(true);
      const data = await getResources();
      setResources(data);
      setLoadingResources(false);
    };
    loadResources();
  }, []);

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const selectedMethodology = useMemo(() => {
    if (!selectedId) setActiveSection(null);
    return METHODOLOGY_7P.find(m => m.id === selectedId);
  }, [selectedId]);

  // Filter resources for current pillar
  const pillarResources = useMemo(() => {
    if (!selectedId) return { videos: [], notes: [] };

    const relevant = resources.filter(r => r.pilares?.includes(selectedId));

    return {
      videos: relevant.filter(r => r.format === 'VIDEO'),
      notes: relevant.filter(r => r.format !== 'VIDEO')
    };
  }, [selectedId, resources]);

  return (
    <Layout>
      <div className="bg-[var(--bg-base)] pt-8 pb-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors text-sm font-bold uppercase tracking-widest group">
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Volver al Inicio
            </Link>
          </div>

          {/* Header - Level 1 */}
          <div className="text-center mb-16 reveal-on-scroll">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4">
              Metodología <span className="text-[var(--color-primary)]">Octopus 7P</span>
            </h1>
            <p className="text-xl text-[var(--text-muted)] max-w-3xl mx-auto">
              El pulpo no es un logo. Es una forma de decidir.
            </p>
          </div>

          {/* Grid - Level 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 reveal-on-scroll">
            {METHODOLOGY_7P.map((item) => (
              <div
                key={item.id}
                className="reveal-child bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-8 flex flex-col items-start hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:shadow-[rgba(0,255,157,0.10)] transition-all cursor-pointer group h-full relative overflow-hidden"
                onClick={() => setSelectedId(item.id)}
              >
                {/* Colored top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-soft)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 mb-4 w-full">
                  <div className="w-14 h-14 bg-[var(--bg-surface)] group-hover:bg-[var(--bg-elevated)] rounded-md flex items-center justify-center text-2xl transition-colors shadow-inner">
                    {(item as any).icon || item.key}
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">{item.letter}</h3>
                </div>

                <p className="text-lg text-[var(--text-secondary)] mb-2 font-medium italic">"{item.tagline}"</p>

                {/* Micro-example from symptoms for context */}
                <p className="text-sm text-[var(--text-muted)] mb-6 flex-grow">
                  Ataca problemas como: {item.symptoms[0].toLowerCase()}
                </p>

                <button className="text-[var(--color-primary)] font-bold hover:text-[var(--color-primary-soft)] flex items-center text-sm uppercase tracking-wide mt-auto">
                  Ver detalle <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[var(--text-muted)] text-sm">Hacé click en cada tarjeta para profundizar en el concepto.</p>
          </div>
        </div>

        {/* Modal - Level 2 & 3 */}
        {selectedMethodology && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[var(--bg-base)]/90 backdrop-blur-sm transition-opacity"
              onClick={() => setSelectedId(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in-up">

              {/* Close Button */}
              <button
                onClick={() => { setSelectedId(null); setActiveSection(null); }}
                className="absolute top-4 right-4 p-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-soft)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-8 md:p-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row gap-6 items-start border-b border-[var(--border-subtle)] pb-8 mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-md flex items-center justify-center text-5xl font-bold text-[var(--text-primary)] shadow-lg shrink-0">
                    {selectedMethodology.key}
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">{selectedMethodology.letter}</h2>
                    <p className="text-xl text-[var(--color-primary)] italic">"{selectedMethodology.tagline}"</p>
                  </div>
                </div>

                <div className="space-y-8">

                  {/* Definition */}
                  <div>
                    <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                      {selectedMethodology.description}
                    </p>
                  </div>

                  {/* Two Columns Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Importance */}
                    <div>
                      <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 text-[var(--color-success)] mr-2" />
                        Por qué es clave
                      </h3>
                      <ul className="space-y-3">
                        {selectedMethodology.importance.map((imp, idx) => (
                          <li key={idx} className="text-sm text-[var(--text-muted)] flex items-start">
                            <span className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {imp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Symptoms */}
                    <div className="bg-[rgba(255,77,77,0.12)]/10 border border-[rgba(255,77,77,0.20)] rounded-md p-5">
                      <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 text-[var(--color-danger)] mr-2" />
                        Síntomas de falla
                      </h3>
                      <ul className="space-y-3">
                        {selectedMethodology.symptoms.map((sym, idx) => (
                          <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start">
                            <span className="w-1.5 h-1.5 bg-[var(--color-danger)] rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                            {sym}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="text-[var(--text-primary)] font-bold text-lg mb-4 flex items-center">
                      <Zap className="w-5 h-5 text-[var(--color-primary)] mr-2" fill="currentColor" />
                      Cómo lo trabajamos en Octopus
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedMethodology.actions.map((action, idx) => (
                        <div key={idx} className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border-subtle)] flex items-start">
                          <span className="text-[var(--color-primary)] font-bold mr-3">{idx + 1}.</span>
                          <span className="text-sm text-[var(--text-secondary)]">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Level 3: Dynamic Pill */}
                  <DynamicPill pills={selectedMethodology.pills} />

                  {/* Footer Links */}
                  <div className="border-t border-[var(--border-subtle)] pt-8 mt-8 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setActiveSection(activeSection === 'videos' ? null : 'videos')}
                        className={`flex items-center text-sm transition-colors ${activeSection === 'videos' ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <Video className="w-4 h-4 mr-2" /> Videos relacionados
                      </button>
                      <button
                        onClick={() => setActiveSection(activeSection === 'notes' ? null : 'notes')}
                        className={`flex items-center text-sm transition-colors ${activeSection === 'notes' ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                      >
                        <FileText className="w-4 h-4 mr-2" /> Notas y tips
                      </button>
                    </div>
                    <a href="/quick-diagnostic">
                      <Button size="sm" className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-soft)] border border-[var(--border-strong)]">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Ver impacto en diagnóstico
                      </Button>
                    </a>
                  </div>

                  {/* Level 4: Expandable Content */}
                  {activeSection === 'videos' && (
                    <div className="mt-8 animate-fade-in bg-[var(--bg-base)]/50 p-6 rounded-md border border-[var(--border-subtle)]">
                      <h4 className="text-[var(--text-primary)] font-bold mb-4 flex items-center">
                        <Video className="w-5 h-5 mr-2 text-[var(--color-primary)]" /> Videos Recomendados ({pillarResources.videos.length})
                      </h4>

                      {pillarResources.videos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pillarResources.videos.map((vid, idx) => (
                            <a key={idx} href={vid.downloadUrl} target="_blank" rel="noreferrer" className="flex items-center p-3 bg-[var(--bg-base)] rounded-lg hover:bg-[var(--bg-surface)] transition-colors group">
                              <div className="w-10 h-10 bg-[var(--color-danger)]/10 rounded-full flex items-center justify-center mr-3 group-hover:bg-[var(--color-danger)]/20 text-[var(--color-danger)]">
                                <Video className="w-5 h-5" />
                              </div>
                              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] text-sm font-medium">{vid.title}</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--text-muted)] text-sm italic">No hay videos vinculados a este pilar aún.</p>
                      )}
                    </div>
                  )}

                  {activeSection === 'notes' && (
                    <div className="mt-8 animate-fade-in bg-[var(--bg-base)]/50 p-6 rounded-md border border-[var(--border-subtle)]">
                      <h4 className="text-[var(--text-primary)] font-bold mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-[var(--color-primary)]" /> Recursos y Herramientas ({pillarResources.notes.length})
                      </h4>

                      {pillarResources.notes.length > 0 ? (
                        <div className="space-y-4">
                          {pillarResources.notes.map((note, idx) => (
                            <div key={idx} className="bg-[var(--bg-base)] p-4 rounded-lg border-l-4 border-[var(--color-primary)] flex justify-between items-center group">
                              <div>
                                <h5 className="text-[var(--text-primary)] font-bold text-sm mb-1">{note.title}</h5>
                                <p className="text-[var(--text-muted)] text-sm line-clamp-2">{note.description}</p>
                              </div>
                              {note.downloadUrl && (
                                <a href={note.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold ml-4 whitespace-nowrap">
                                  Ver Recurso &rarr;
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[var(--text-muted)] text-sm italic">No hay notas o herramientas vinculadas aún.</p>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Methodology;
